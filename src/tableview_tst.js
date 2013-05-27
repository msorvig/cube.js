
function makeTestTable()
{
    var ids = ["Foo", "Bar", "Baz"]

    var table = makeTable(ids)

    var rows = [ { Foo: 1, Bar : "A", Baz : 3.14 },
                 { Foo: 2, Bar : "B", Baz : 2.71 },
                 { Foo: 3, Bar : "C", Baz : 6.62 } ]

    rows.forEach(function(row) { 
        table.addRow(row)
    })
    return table
}

test("rows", function() {
    var table = makeTestTable()
    var range = makeRange()
    range.add(0, 1)
    range.add(2, 1)

    var tableView = makeTableView(table, range)

    tableView.foreach(function(row, index){
        deepEqual(row, table.row(index))
    })
});


test("columns", function() {
    var table = makeTestTable()
    var range = makeRange()
    range.add(1, 1) // select 2nd column

    var tableView = makeTableView(table, undefined, range)

    tableView.foreach(function(row, index) {
        var filteredRow = { "Bar" : table.row(index).Bar } // select 2nd column
        deepEqual(row, filteredRow)
    })
});

