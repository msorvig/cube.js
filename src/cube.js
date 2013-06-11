
// Uses a table view as a data source and further filters the data using a query.
function makeTableCube(tableView)
{
    var view = tableView;
    var semantic = {}
    if (view === undefined) {
        console.log("Error: TableCube constructed with null view")
        return undefined
    }

    function select(query)
    {
        //console.log("select " + query)

        // Parse and analyze query
        var ast = parse(query)
        var isValidVariable = function(variableName) { return view.columnIds().indexOf(variableName) != -1 }
        semantic = analyzeAst(ast, isValidVariable)

        // Print expressions with errors
        for (var i = 0; i < semantic.errorExpressions().length; ++i) {
            console.log("invalid expression")
            console.log(semantic.errorExpressions()[i])
        }

        // select columns: all dimensions, and measures as determined by the query
        var measures = selectColumns(view.measureIds(), semantic.includeColumns(), semantic.excludeColumns())
        var columns = view.dimensionIds().concat(measures)
        var columnIndexes = lookupColumns(columns)

        // select rows as determined by the query
        var rowRange = selectRows(view, semantic)
        // the base view is a filtered view to the fact table
        var baseView = makeTableView(view.table(), rowRange, columnIndexes)

        // determine dimensions based on the query
        var dimensions = selectColumns(view.dimensionIds(), semantic.includeColumns(), semantic.excludeColumns())
        var dimensionIndexes = lookupColumns(dimensions)

        // return the base view if all dimensions are selected - no cube computation in this case
        if (dimensions.length == view.dimensionIds().length)
            return baseView

		var rowExpressionKey = semantic.rowExpressionsString()

        // compute cube(s)
        var cubeView = computeCubesForApex(dimensionIndexes, baseView, rowExpressionKey)
        return cubeView
    }

	// Returns the iterms that are both in array1 and array2
    function intersect(array1, array2) {
        return array1.filter(function(item) {
            return (array2.indexOf(item) != -1)
        })
    }

	// Selects columns. include/exclude bases on includeColumns and excludeColumns
	// As a special case, including no columns selects all coulumns
    function selectColumns(allColumns, includeColumns, excludeColumns) {
        var columns = []

        // start with the included columns, or all columns if
        // none are in the include array.
        if (intersect(allColumns, includeColumns).length > 0)
            columns = includeColumns
        else
            columns = allColumns

        // remove excluded columns
        for (var i = 0; i < excludeColumns.length; ++i)
            columns.splice(columns.indexOf(excludeColumns[i]), 1)

        return columns
    }

    // columnId -> columnIndex
    function lookupColumns(columnIds) {
        return columnIds.map(function(columnId) {
             return view.lookupColumn(columnId)
        })
    }

    function selectRows(view, semantic) {
        var rangeBuilder = RangeBuilder()

        // run the query expressions on each row
        view.foreach(function(rowIndex){
            var columnValueLookup = function(column) { return view.row(rowIndex)[column] }
            if (semantic.isRowSelected(columnValueLookup))
                rangeBuilder.add(rowIndex, 1)
        })

        return rangeBuilder.range()
    }

	// Compute the cube "pyramid". For example:
    // Dimenssions: A - B - C
    // Cubes:                 []
    //          [A]          [B]              [C]
    //     [A,B]  [A,C] [B,A], [B, C]   [C, B], [C, A]
	//
	// Cube computation starts top-down at the "apex" dimention(s),
	// which can for example be [A] or [A,B] (depending on the query)
	//
	// Computed cubes and sub-cubes are cached.
	//
	// TODO: support computing the top "[]" cube
	//
	var m_cubeCaches = {}
	var m_key = ""	// active cache key
	var m_ranges   // cube name -> row range
	var m_cubeTable
    function computeCubesForApex(apexDimensions, view, rowExpressionKey){

		// Set up cube cache. Since a query might select a subset of all rows
		// each distinct query needs a separate cache, keyed on rowExpressionKey.
		// Each cache entry contains a table for storing computed cube rows and
		// ranges for the individual cubes.
		m_key = rowExpressionKey
		if (m_cubeCaches[m_key] === undefined)
			m_cubeCaches[m_key] = { range : {}, table : makeTable(view.columns()) }

		var cubeCache = m_cubeCaches[m_key]
		m_ranges = cubeCache.range
		m_cubeTable = cubeCache.table

        var allDimensions = view.dimensionIndexes()

        if (apexDimensions.length == allDimensions.length)
            return view

        computeCubesForApexHelper(view, apexDimensions, allDimensions)
        var cubeRange = m_ranges[canonicalCubeName(apexDimensions)]
        return makeTableView(m_cubeTable, cubeRange, apexDimensions.concat(view.measureIndexes()))
    }

    function computeCubesForApexHelper(view, apexDimensions, allDimensions) {
        if (apexDimensions === undefined)
            return

        var cubeName = canonicalCubeName(apexDimensions)
        if (m_ranges[cubeName] !== undefined) {
            return m_ranges[cubeName] // already computed
        }

        // recurse to subcubes
        var shellCubes = true
        var rollups = rollupDimensions(apexDimensions, allDimensions)
        var rollupDimension = undefined
        if (rollups.length == 0)
            return

        // if iceberg then compute a minimal set of cubes for the given apex cube.
        if (shellCubes) {
            // check if we can re-use a cube by rolling up a spesific dimension
            rollups.forEach(function(rollup) {
                var subName = canonicalCubeName(apexDimensions.concat(rollup))
                if (m_ranges[cubeName] !== undefined) {
                    rollupDimension = rollup // found cached cube
                }
            })

            if (rollupDimension === undefined) {
                // no cached cube found, roll up the first dimension
                rollupDimension = rollups[0]
                var subCube = apexDimensions.concat(rollupDimension)
                computeCubesForApexHelper(view, subCube, allDimensions)
            }
        } else {
            // compute all sub-cubes
            rollups.forEach(function(rollup) {
                var subApex = apexDimensions.concat(rollup)
                computeCubesForApexHelper(view, subApex, allDimensions)
            })
            rollupDimension = rollups[0] // roll up the first dimension
        }

        // computing a subcube might have computed this cube as a side effect:
        if (m_ranges[cubeName] !== undefined) {
            return m_ranges[cubeName]
        }

        // returning from recursion, now compute *this* cube which we can do by
        // rolling up the dimension we previosly compuded a subcube for.
        m_ranges[cubeName] = computeCubeRows(view, apexDimensions, rollupDimension)
        return m_ranges[cubeName]
    }

    function computeCubeRows(view, apexDimensions, rollupDimension) {

		var acc_rangeBuilders = {} // cube name -> RangeBuider

        // visit the view "cells" (the combinations of dimension values) and accumulate measures
        view.visitCells(apexDimensions,
            function(view, dimensions, values) {
                // leaf. This accumulates rows for the target cube.
                accumulateRows(view, dimensions, values)
        },  function(view, dimensions, values) {
                // interior. This accumulates rows for "higher" cubes and is optional. 
				// Pro: The views have already been generated
				// Con: measures will be (re)-accumulated from the base fact table,
				// duplicating work
                accumulateRows(view, dimensions, values)
        })

        // finalize: create views from range builders
        for (key in acc_rangeBuilders) {
            m_ranges[key] = acc_rangeBuilders[key].range()
        }

        return m_ranges[canonicalCubeName(apexDimensions)]

        function accumulateRows(view, dimensions, values) {
            var acc_row = {}

            // copy dimensions
            dimensions.forEach(function(dim, index) {
                acc_row[view.column(dim).id] = values[index]
            })

            // accumulate each measure
            view.foreach(function(rowIndex) {
                view.measureIds().forEach(function(measure) {
                    if (acc_row[measure] == undefined)
                        acc_row[measure]  = 0
                    acc_row[measure] += view.row(rowIndex)[measure]
                })
            })

            // add row to table and the row index ot the cube's view.
            var cubeName = canonicalCubeName(dimensions)
            var rowIndex = m_cubeTable.addRow(acc_row)
            if (acc_rangeBuilders[cubeName] === undefined) {
               acc_rangeBuilders[cubeName] = RangeBuilder()
           }
           acc_rangeBuilders[cubeName].add(rowIndex, 1)
        }

    }

    function rollupDimensions(apexDimensions, allDimensions) {
        return allDimensions.filter(function(dim){ return apexDimensions.indexOf(dim) == -1 })
    }

    function subCubes(apexDimensions, allDimensions) {
        if (allDimensions.length - apexDimensions.length == 1)
            return []
        var restDimensions = allDimensions.filter(function(dim){ return apexDimensions.indexOf(dim) == -1 })
        var subCubes = []
        restDimensions.forEach(function(dim) {
            subCubes.push(apexDimensions.concat([dim]))
        })
        return subCubes
    }

    function canonicalCubeName(dimensions) {
        return dimensions.slice(0).sort().join(" ") // sort: ABC is the same cube as BAC
    }

    return { "select" : select ,
             "subCubes" : subCubes,
    }
}

function makeCube(view)
{
    return makeTableCube(view)
}

function cubeSelect(view, query) {
    return makeCube(view).select(query)
}
