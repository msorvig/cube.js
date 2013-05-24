test("columns", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    ok(table)
    deepEqual(table.fieldIds(), ids)
})

test("rows", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)

    var row0 = ["1", "A", "3.14"]
    var row1 = ["2", "B", "2.71"]
    var row2 = ["2", "B", "6.62"]

    equal(table.rowCount(), 0)

    table.addRow(row0)
    table.addRow(row1)
    table.addRow(row2)

    equal(table.rowCount(), 3)
    equal(table.row(0), row0)
    equal(table.row(1), row1)
    equal(table.row(2), row2)
})
