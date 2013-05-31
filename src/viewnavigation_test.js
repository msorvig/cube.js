function makeTestTable()
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
    return table
}

test("uniqueValues", function() {
    var table = makeTestTable()
    var tableView = makeTableView(table)
    var viewNavigation = makeViewNavigation(tableView)

    deepEqual(viewNavigation.uniqueValues("Foo"), [1, 2, 3])
    deepEqual(viewNavigation.uniqueValues("Bar"), ["A", "B", "C"])
})

test("select", function(){
    var table = makeTestTable()
    var tableView = makeTableView(table)
    var viewNavigation = makeViewNavigation(tableView)
    
    var nav2 = makeViewNavigation(viewNavigation.select("Foo == 2"))
    deepEqual(nav2.uniqueValues("Foo"), [2])
})

test("subViews", function() {
    var nav = makeViewNavigation(makeTableView(makeTestTable()))
    var subviews = nav.subViews("Bar")
    deepEqual(makeViewNavigation(subviews["A"]).uniqueValues("Baz"), [1, 4, 7])
    deepEqual(makeViewNavigation(subviews["B"]).uniqueValues("Baz"), [2, 5, 8])
    deepEqual(makeViewNavigation(subviews["C"]).uniqueValues("Baz"), [3, 6, 9])
    
//    for (key in subviews) {
//        console.log(key)
//        console.log(makeViewNavigation(subviews[key]).uniqueValues("Baz"))
//    }
})