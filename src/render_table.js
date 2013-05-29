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
