test("Construct", function() {
    var rangeBuilder = RangeBuilder()
    var range = rangeBuilder.range()
    ok(rangeBuilder.range().contains(-1) == false)
    ok(rangeBuilder.range().contains(0) == false)
    ok(rangeBuilder.range().contains(1) == false)
    ok(rangeBuilder.range().isEmpty())

    rangeBuilder.add(1, 2)
    range = rangeBuilder.range()
    ok(rangeBuilder.range().contains(0) == false)
    ok(rangeBuilder.range().contains(1) == true)
    ok(rangeBuilder.range().contains(2) == true)
    ok(rangeBuilder.range().contains(3) == false)
})

test("add-grow", function() {
    var rangeBuilder = RangeBuilder()

    rangeBuilder.add(0, 1)
    ok(rangeBuilder.range().contains(0))
    ok(!rangeBuilder.range().contains(1))

    rangeBuilder.add(0, 1)
    ok(rangeBuilder.range().contains(0))
    ok(!rangeBuilder.range().contains(1))

    rangeBuilder.add(1, 1)
    ok(rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1))
    ok(!rangeBuilder.range().contains(2))

    rangeBuilder.add(0, 2)
    ok(rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1))
    ok(!rangeBuilder.range().contains(2))

    rangeBuilder.add(0, 3)
    ok(rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1))
    ok(rangeBuilder.range().contains(2))

    rangeBuilder.add(1, 3)
    ok(rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1))
    ok(rangeBuilder.range().contains(2))
    ok(rangeBuilder.range().contains(3))
    ok(!rangeBuilder.range().contains(4))
})

test("add-block", function() {
    var rangeBuilder = RangeBuilder()
    rangeBuilder.add(1, 2)
    rangeBuilder.add(4, 2)
    rangeBuilder.add(7, 1)
    ok(!rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1))
    ok(rangeBuilder.range().contains(2))
    ok(!rangeBuilder.range().contains(3))
    ok(rangeBuilder.range().contains(4))
    ok(rangeBuilder.range().contains(5))
    ok(!rangeBuilder.range().contains(6))
    ok(rangeBuilder.range().contains(7))
    ok(!rangeBuilder.range().contains(8))
});

test("rangeBuilder.range().contains", function() {
    var rangeBuilder = RangeBuilder()

    rangeBuilder.add(0, 4)
    ok(rangeBuilder.range().contains(0, 4))
    ok(!rangeBuilder.range().contains(0, 5))

    ok(rangeBuilder.range().contains(1, 3))
    ok(!rangeBuilder.range().contains(2, 6))
});

test("add-merge", function() {
    var rangeBuilder = RangeBuilder()

    rangeBuilder.add(1, 2)
    rangeBuilder.add(4, 2)
    ok(!rangeBuilder.range().contains(0))
    ok(rangeBuilder.range().contains(1, 2))
    ok(!rangeBuilder.range().contains(3))
    ok(rangeBuilder.range().contains(4, 2))
    ok(!rangeBuilder.range().contains(6))
    rangeBuilder.add(2, 3)
    ok(rangeBuilder.range().contains(1, 5))
    ok(!rangeBuilder.range().contains(1, 6))
    
    rangeBuilder = RangeBuilder()
    rangeBuilder.add(4, 2)
    rangeBuilder.add(5, 2)
    rangeBuilder.add(10, 50)
    rangeBuilder.add(1, 60)
    ok(rangeBuilder.range().contains(1, 60))
    ok(!rangeBuilder.range().contains(1, 61))
    ok(!rangeBuilder.range().contains(0, 60))

    var rangeBuilder = RangeBuilder()
    rangeBuilder.add(0, 1)
    rangeBuilder.add(2, 1)
    ok(rangeBuilder.range().contains(0))
    ok(!rangeBuilder.range().contains(1))
    ok(rangeBuilder.range().contains(2))
    ok(!rangeBuilder.range().contains(3))
})

test("forEach", function() {
    var rangeBuilder = RangeBuilder()
    rangeBuilder.add(0, 1)
    rangeBuilder.add(2, 1)

    var seen = []
    rangeBuilder.range().forEach(function(index) {
        seen.push(index)
    })
    equal(seen.length, 2)
    equal(seen.indexOf(0), 0)
    equal(seen.indexOf(2), 1)
})

test("map", function() {
    var range = RangeBuilder(0, 10).range()
    var incremented = range.map(function(index) { return index + 1 })
    equal(incremented.length, 10)
    equal(incremented[0], 1)
    equal(incremented[5], 6)
})

test("filter", function() {
    var range = RangeBuilder(0, 10).range()
    var selected = range.filter(function(index) { return index == 6})
    equal(selected.length, 1)
    equal(selected[0], 6)
})

test("filtered", function() {
    var range = RangeBuilder(0, 10).range()
    var filtered = range.filtered(function(index) { return index == 6 })
    equal(filtered.contains(5), false)
    equal(filtered.contains(6), true)
    equal(filtered.contains(7), false)
})



