test("Construct", function() {
    var range = makeRange()
    ok(inRange(range, -1) == false)
    ok(inRange(range, 0) == false)
    ok(inRange(range, 1) == false)
    ok(isEmptyRange(range))
});

test("add-grow", function() {
    var range = makeRange()

    addRange(range, 0, 1)
    ok(inRange(range, 0))
    ok(!inRange(range, 1))
    
    addRange(range, 0, 1)
    ok(inRange(range, 0))
    ok(!inRange(range, 1))

    addRange(range, 1, 1)
    ok(inRange(range, 0))
    ok(inRange(range, 1))
    ok(!inRange(range, 2))

    addRange(range, 0, 2)
    ok(inRange(range, 0))
    ok(inRange(range, 1))
    ok(!inRange(range, 2))

    addRange(range, 0, 3)
    ok(inRange(range, 0))
    ok(inRange(range, 1))
    ok(inRange(range, 2))

    addRange(range, 1, 3)
    ok(inRange(range, 0))
    ok(inRange(range, 1))
    ok(inRange(range, 2))
    ok(inRange(range, 3))
    ok(!inRange(range, 4))
})

test("add-block", function() {
    var range = makeRange()
    addRange(range, 1, 2)
    addRange(range, 4, 2)
    addRange(range, 7, 1)
    ok(!inRange(range, 0))
    ok(inRange(range, 1))
    ok(inRange(range, 2))
    ok(!inRange(range, 3))
    ok(inRange(range, 4))
    ok(inRange(range, 5))
    ok(!inRange(range, 6))
    ok(inRange(range, 7))
    ok(!inRange(range, 8))
});

test("inRange", function() {
    var range = makeRange()
    
    addRange(range, 0, 4)
    ok(inRange(range, 0, 4))
    ok(!inRange(range, 0, 5))

    ok(inRange(range, 1, 3))
    ok(!inRange(range, 2, 6))
});

test("add-merge", function() {
    var range = makeRange()
    
    addRange(range, 1, 2)
    addRange(range, 4, 2)
    ok(!inRange(range, 0))
    ok(inRange(range, 1, 2))
    ok(!inRange(range, 3))
    ok(inRange(range, 4, 2))
    ok(!inRange(range, 6))
    addRange(range, 2, 3)
    ok(inRange(range, 1, 5))
    ok(!inRange(range, 1, 6))
    
    range = makeRange()
    addRange(range, 4, 2)
    addRange(range, 5, 2)
    addRange(range, 10, 50)
    addRange(range, 1, 60)
    ok(inRange(range, 1, 60))
    ok(!inRange(range, 1, 61))
    ok(!inRange(range, 0, 60))
});



