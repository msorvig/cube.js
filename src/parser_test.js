// test lexer.js parser.js semantic.js

var lookups = 0
function lookup(variable) {
    console.log("lookup " + variable)
    ++lookups
    return 1
}

function evalExpression(expressionString) {
    return evalExpressions(expressionString)[0]
}

function evalExpressions(expressionsString) {
    return evalExpressionListAst(parse(lex(expressionsString)), lookup)
}

test("expressions", function() {
    equal(evalExpression("2 + 3"), 5)
    equal(evalExpression("2 < 3"), true)
    equal(evalExpression("2 >= 3"), false)
    equal(evalExpression("(5 + 9) * (7 -4)"), 42)
    equal(evalExpression("5 + 9 * 7 -4"), 64)

    equal(lookups, 0)
})

test("errors", function() {
    deepEqual(evalExpressions("2 & 5"), [2, NaN, 5])
    deepEqual(evalExpressions("2 + 3 & (-5)"), [5, NaN, -5])
    deepEqual(evalExpressions("(2 + &) 5"), [NaN, 5])

    equal(lookups, 0)
})

test("strings", function() {
    equal(evalExpression("'foo'"), "foo")
    equal(evalExpression('"foo"'), "foo")
    equal(evalExpression('"foo" == "foo"'), true)
    equal(evalExpression('"foo" == "bar"'), false)
    equal(evalExpression('"foo" != "bar"'), true)
})
