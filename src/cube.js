
function loadData(dataUrl, callback)
{
    var data = {}
    $.getJSON(dataUrl + '/data.json', function(data) {
        callback(data)        
    })
}

// Uses a table view as a data source and further filters the data using a query.
function makeTableCube(tableView)
{
    var view = tableView;
    var sem = {}
    if (view === undefined)
        console.log("Error: TableCube constructed with null view")

    function select(query)
    {
        //console.log("select " + query)

        // Parse and analyze query
        var ast = perseQuery(query)
        var isValidVariable = function(variableName) { return view.columns().indexOf(variableName) != -1 }
        sem = semantic(ast, isValidVariable)

        // Print expressions with errors
        for (var i = 0; i < sem.errorExpressions().length; ++i) {
            console.log("invalid expression")
            console.log(sem.errorExpressions()[i])
        }

        // create column and row ranges with selected columns/rows
        var columns = selectColumns(view.columns(), sem.includeColumns(), sem.excludeColumns())
        var columnRange = makeColumnRange(columns)
        var rowRange = selectRows(view, sem)

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

    function selectRows(view, sem) {
        var rowRange = makeRange()

        // run the query expressions on each row
        view.foreach(function(row, index){
            var columnValueLookup = function(column) { return row[column] }
            if (sem.isRowSelected(columnValueLookup))
                rowRange.add(index, 1)
        })

        return rowRange
    }

    return { "select" : select }
}

function makeCube(dataTable)
{
    return new makeTableCube(dataTable)
}

// view->html converter
function table2html(destination, view)
{
    destination.empty()

    // header
    var head = $("<thead>")
    destination.append(head)
    var tr = $("<tr/>¨")
    head.append(tr)
    view.columns().forEach(function(value) {
        tr.append("<th>" + value + "</th>")
    })
    
    // rows
    view.foreach(function(row, index) {
        var tr = $("<tr/>")
        destination.append(tr)
        view.columns().forEach(function(header) {
            tr.append("<td>" + row[header] + "</td>")
        })
    })
}
