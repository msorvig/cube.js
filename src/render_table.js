// view->html converter
function createTable(view)
{
    // header
    var table = $("<table id=letable>")
    var head = table.append($("<thead>"))
    var tr = $("<tr/>¨")
    head.append(tr)
    view.columns().forEach(function(value) {
        tr.append("<th>" + value + "</th>")
    })
    
    // rows
    view.foreach(function(row, index) {
        var tr = $("<tr/>")
        table.append(tr)
        view.columns().forEach(function(header) {
            tr.append("<td>" + row[header] + "</td>")
        })
    })
    return table
}
