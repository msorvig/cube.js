
function getJson(url, callback) {
    var request = new XMLHttpRequest();
    request.onload = function(e) {
        if(request.status == 200) {
            callback(JSON.parse(request.responseText))
        } else {
            console.log("getJson: Error opening " + url + " Status: " + request.status)
        }
    };
    request.open("get", url, true);
    request.send();
}

function loadData(dataUrl, callback)
{
    getJson(dataUrl + '/data.json' , callback)
}

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
        var isValidVariable = function(variableName) { return view.columns().indexOf(variableName) != -1 }
        semantic = analyzeAst(ast, isValidVariable)

        // Print expressions with errors
        for (var i = 0; i < semantic.errorExpressions().length; ++i) {
            console.log("invalid expression")
            console.log(semantic.errorExpressions()[i])
        }

        // create column and row ranges with selected columns/rows
        var columns = selectColumns(view.columns(), semantic.includeColumns(), semantic.excludeColumns())
        var columnRange = makeColumnRange(columns)
        var rowRange = selectRows(view, semantic)

        // create and return the new view
        return makeTableView(view.table(), rowRange, columnRange)
    }

    function selectColumns(allColumns, includeColumns, excludeColumns) {
        var columns = []

        // start with includeColumns from the query or all if includeColumns is empty.
        if (includeColumns.length > 0)
            columns = includeColumns
        else
            columns = allColumns

        // remove excluded columns
        for (var i = 0; i < excludeColumns.length; ++i)
            columns.splice(columns.indexOf(excludeColumns[i]), 1)

        return columns
    }

    // columnId -> columnIndex
    function makeColumnRange(columnIds) {
        var range = makeRange()
        columnIds.forEach(function(id){
            range.add(view.lookupColumn(id), 1)
        })
        return range;
    }

    function selectRows(view, semantic) {
        var rowRange = makeRange()

        // run the query expressions on each row
        view.foreach(function(row, index){
            var columnValueLookup = function(column) { return row[column] }
            if (semantic.isRowSelected(columnValueLookup))
                rowRange.add(index, 1)
        })

        return rowRange
    }

    return { "select" : select }
}

function makeCube(view)
{
    return makeTableCube(view)
}
