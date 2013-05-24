test("columns", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    ok(table)
    deepEqual(fieldIds(table) , ids)
});


test("rows", function() {
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)

    var row0 = ["1", "A", "3.14"]
    var row1 = ["2", "B", "2.71"]
    var row2 = ["2", "B", "6.62"]

    equal(rowCount(table), 0)

    addRow(table, row0)
    addRow(table, row1)
    addRow(table, row2)

    equal(rowCount(table), 3)
    equal(row(table, 0), row0)
    equal(row(table, 1), row1)
    equal(row(table, 2), row2)

});
