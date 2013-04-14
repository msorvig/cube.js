// 
function loadData(dataUrl, callback)
{
    var data = {}
    $.getJSON(dataUrl + '/data.json', function(data) {
        callback(data)        
    })
}

// Simple cube that uses a single table as a data source
function TableCube()
{
    return { "setTable" : setTable,
             "select" : select }
    var table;

    function setTable(table)
    {
        this.table = table
    }
    
    function select(query)
    {
        console.log("select " + query)
        return this.table
    }
}

// table->html converter
function table2html(destination, table)
{
    destination.empty()

    // header
    var head = $("<thead>")
    destination.append(head)
    var tr = $("<tr/>¨")
    head.append(tr)
    $(table.schema.fields).each(function(index, value) {
        tr.append("<th>" + value.id + "</th>")
    })
    
    // rows
    $(table.rows).each(function(index, row) {
        var tr = $("<tr/>")
        destination.append(tr)
        $(table.schema.fields).each(function(index, header) {
            tr.append("<td>" + row[header.id] + "</td>")
        })
    })
}

