function makeTestTable()
{
    var ids = ["Foo", "Bar", "Baz"]
    var labels = ["Foo", "Bar", "Baz"]
    var kinds = ["dimension", "dimension", "measure"]

    var table = makeTable(ids, labels, kinds)

    var rows = [ { Foo: 1, Bar : "A", Baz : 3.14 },
                 { Foo: 2, Bar : "B", Baz : 2.71 },
                 { Foo: 3, Bar : "C", Baz : 6.62 } ]

    rows.forEach(function(row) { 
        table.addRow(row)
    })
    return table
}

test("query", function() {
    var cube = makeCube(undefined)
    equal(cube, undefined)

    var table = makeTestTable()
    var tableView = makeTableView(table)
    var cube = makeCube(tableView)
    ok(cube)
    
    // pass through (null query)
    var selectView = cube.select("")
    selectView.foreach(function(row, index) {
        deepEqual(row, table.row(index))
    })
    
    // select row 2
    selectView = cube.select("Foo > 1 Baz > 5")
    selectView.foreach(function(row, index) {
        deepEqual(row, table.row(2))
    })

    // select Column 1
    selectView = cube.select("Foo")
    selectView.foreach(function(row, index) {
        equal(row["Foo"], table.row(index)["Foo"])
        equal(row["Bar"], undefined)
    })
    
    // exclude Column 1
    selectView = cube.select("-Foo")
    selectView.foreach(function(row, index) {
        equal(row["Foo"], undefined)
    })
})

test("cubes", function() {
    
    var cube = makeCube(makeTableView(makeTestTable()))
    ok(cube)

    deepEqual(cube.subCubes([],["A","B","C"]), [["A"], ["B"], ["C"]])
    deepEqual(cube.subCubes(["A"],["A","B","C"]), [["A","B"],["A","C"]])
    deepEqual(cube.subCubes(["B"],["A","B","C"]), [["B","A"],["B","C"]])
    deepEqual(cube.subCubes(["A","B"],["A","B","C"]), [])

    deepEqual(cube.subCubes(["A", "B"],["A","B","C", "D"]), [["A","B", "C"],["A","B", "D"]])
})

