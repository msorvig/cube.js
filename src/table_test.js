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

test("columns", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    ok(table)
    deepEqual(table.fieldIds(), ids)
})

test("rows", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)

    var row0 = { Foo: 1, "Bar" : "A", Baz : 3.14 }
    var row1 = { Foo: 2, "Bar" : "B", Baz : 2.71 }
    var row2 = { Foo: 3, "Bar" : "C", Baz : 6.62 }

    equal(table.rowCount(), 0)

    equal(table.addRow(row0), 0)
    equal(table.addRow(row1), 1)
    equal(table.addRow(row2), 2)

    equal(table.rowCount(), 3)
    equal(table.row(0), row0)
    equal(table.row(1), row1)
    equal(table.row(2), row2)
})

test("cell", function() {
    var table = makeTestTable()
    equal(table.cell(0, "Foo"), 1)
    equal(table.cell(0, 0), 1)
})

test("clone", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    deepEqual(table.fieldIds(), ids)
    var clone = makeTable(table.fields())
    deepEqual(clone.fieldIds(), ids)

    var row0 = { Foo: 1, "Bar" : "A", Baz : 3.14 }
    clone.addRow(row0)
    equal(clone.row(0), row0)
})