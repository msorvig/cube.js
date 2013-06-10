
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
        var ast = perseQuery(query)
        var isValidVariable = function(variableName) { return view.columnIds().indexOf(variableName) != -1 }
        semantic = analyzeAst(ast, isValidVariable)

        // Print expressions with errors
        for (var i = 0; i < semantic.errorExpressions().length; ++i) {
            console.log("invalid expression")
            console.log(semantic.errorExpressions()[i])
        }

        // create column and row ranges with selected columns/rows, making sure
        // there is at least one dimension ans one measure
        var dimensions = selectColumns(view.dimensionIds(), semantic.includeColumns(), semantic.excludeColumns())
        var measures = selectColumns(view.measureIds(), semantic.includeColumns(), semantic.excludeColumns())
        var columns = dimensions.concat(measures)
        var columnIndexes = lookupColumns(columns)
        var rowRange = selectRows(view, semantic)

        // create and return the new view
        return makeTableView(view.table(), rowRange, columnIndexes)
    }

    function intersection(array1, array2) {
        return array1.filter(function(item) {
            return (array2.indexOf(item) != -1)
        })
    }

    function selectColumns(allColumns, includeColumns, excludeColumns) {
        var columns = []

        // start with the included columns, or all columns if
        // none are in the include array.
        if (intersection(allColumns, includeColumns).length > 0)
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
        view.foreach(function(row, index){
            var columnValueLookup = function(column) { console.log(column); return row[column] }
            if (semantic.isRowSelected(columnValueLookup))
                rangeBuilder.add(index, 1)
        })

        return rangeBuilder.range()
    }

    return { "select" : select }
}

function makeCube(view)
{
    return makeTableCube(view)
}

function cubeSelect(view, query) {
    return makeCube(view).select(query)
}
