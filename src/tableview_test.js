
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
    var rangeBuilder = RangeBuilder()
    rangeBuilder.add(0, 1)
    rangeBuilder.add(2, 1)

    var tableView = makeTableView(table, rangeBuilder.range())

    tableView.foreach(function(row, index){
        deepEqual(row, table.row(index))
    })
});


test("columns", function() {
    var table = makeTestTable()
	var columns = [1] // select 2nd column

    var tableView = makeTableView(table, undefined, columns)

    tableView.foreach(function(row, index) {
        var filteredRow = { "Bar" : table.row(index).Bar } // select 2nd column
        deepEqual(row, filteredRow)
    })

    equal(tableView.lookupColumn("Bar"), 1)
    equal(tableView.lookupColumn("Foo"), undefined) // or -1? (like Array.indexOf)
});

function makeTestView()
{
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    var rows = [ { Foo: 1, Bar : "A", Baz : 1 },
                 { Foo: 1, Bar : "B", Baz : 2 },
                 { Foo: 1, Bar : "C", Baz : 3 },
                 { Foo: 2, Bar : "A", Baz : 4 },
                 { Foo: 2, Bar : "B", Baz : 5 },
                 { Foo: 2, Bar : "C", Baz : 6 },
                 { Foo: 3, Bar : "A", Baz : 7 },
                 { Foo: 3, Bar : "B", Baz : 8 },
                 { Foo: 3, Bar : "C", Baz : 9 } ]

    rows.forEach(function(row) {
        table.addRow(row)
    })
    return makeTableView(table)
}

test("uniqueValues", function() {
    var viewNavigation = makeTestView()

    deepEqual(viewNavigation.uniqueValues("Foo"), [1, 2, 3])
    deepEqual(viewNavigation.uniqueValues("Bar"), ["A", "B", "C"])
})

test("subViews", function() {
    var view = makeTestView()

    var subviews = view.subViews("Bar")
    deepEqual(subviews["A"].uniqueValues("Baz"), [1, 4, 7])
    deepEqual(subviews["B"].uniqueValues("Baz"), [2, 5, 8])
    deepEqual(subviews["C"].uniqueValues("Baz"), [3, 6, 9])

//    for (key in subviews) {
//        console.log(key)
//        console.log(makeViewNavigation(subviews[key]).uniqueValues("Baz"))
//    }
})

