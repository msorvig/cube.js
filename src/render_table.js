// view->html converter
function createTable(view)
{
    // header
    var table = $("<table class='table table-condensed table-striped table-bordered'>")
    var head = table.append($("<thead>"))
    var tr = $("<tr/>¨")
    head.append(tr)
    view.columnIds().forEach(function(value) {
        tr.append("<th>" + value + "</th>")
    })
    
    // rows
    view.foreach(function(index) {
        var tr = $("<tr/>")
        table.append(tr)
        view.columnIds().forEach(function(header) {
            tr.append("<td>" + view.row(index)[header] + "</td>")
        })
    })
    return table
}
