test("Construct", function() {
    var range = makeRange()
    ok(range.contains(-1) == false)
    ok(range.contains(0) == false)
    ok(range.contains(1) == false)
    ok(range.isEmpty())

    range = makeRange(1, 2)
    ok(range.contains(0) == false)
    ok(range.contains(1) == true)
    ok(range.contains(2) == true)
    ok(range.contains(3) == false)
})

test("add-grow", function() {
    var range = makeRange()

    range.add(0, 1)
    ok(range.contains(0))
    ok(!range.contains(1))

    range.add(0, 1)
    ok(range.contains(0))
    ok(!range.contains(1))

    range.add(1, 1)
    ok(range.contains(0))
    ok(range.contains(1))
    ok(!range.contains(2))

    range.add(0, 2)
    ok(range.contains(0))
    ok(range.contains(1))
    ok(!range.contains(2))

    range.add(0, 3)
    ok(range.contains(0))
    ok(range.contains(1))
    ok(range.contains(2))

    range.add(1, 3)
    ok(range.contains(0))
    ok(range.contains(1))
    ok(range.contains(2))
    ok(range.contains(3))
    ok(!range.contains(4))
})

test("add-block", function() {
    var range = makeRange()
    range.add(1, 2)
    range.add(4, 2)
    range.add(7, 1)
    ok(!range.contains(0))
    ok(range.contains(1))
    ok(range.contains(2))
    ok(!range.contains(3))
    ok(range.contains(4))
    ok(range.contains(5))
    ok(!range.contains(6))
    ok(range.contains(7))
    ok(!range.contains(8))
});

test("range.contains", function() {
    var range = makeRange()

    range.add(0, 4)
    ok(range.contains(0, 4))
    ok(!range.contains(0, 5))

    ok(range.contains(1, 3))
    ok(!range.contains(2, 6))
});

test("add-merge", function() {
    var range = makeRange()

    range.add(1, 2)
    range.add(4, 2)
    ok(!range.contains(0))
    ok(range.contains(1, 2))
    ok(!range.contains(3))
    ok(range.contains(4, 2))
    ok(!range.contains(6))
    range.add(2, 3)
    ok(range.contains(1, 5))
    ok(!range.contains(1, 6))
    
    range = makeRange()
    range.add(4, 2)
    range.add(5, 2)
    range.add(10, 50)
    range.add(1, 60)
    ok(range.contains(1, 60))
    ok(!range.contains(1, 61))
    ok(!range.contains(0, 60))

    var range = makeRange()
    range.add(0, 1)
    range.add(2, 1)
    ok(range.contains(0))
    ok(!range.contains(1))
    ok(range.contains(2))
    ok(!range.contains(3))
})

test("forEach", function() {
    var range = makeRange()
    range.add(0, 1)
    range.add(2, 1)

    var seen = []
    range.forEach(function(index){
        seen.push(index)
    })
    equal(seen.length, 2)
    equal(seen.indexOf(0), 0)
    equal(seen.indexOf(2), 1)
    ok(range)
})

