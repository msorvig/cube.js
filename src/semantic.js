// Concat all the node types in an ast to a string, for example "VariableExpressionUnaryOperator"
function typeStringConcatVisit(rootNode) {
    var string = ""
    rootNode.visit(function(node) {
        string += node.type
    })
    return string
}

// Checks if all variableExpressions references valid variables
function validVariableVisit(rootNode, lookupVariable) {
    var valid = true
    rootNode.visit(function(node) {
        if (node.type === AstType.VariableExpression)
            if (!lookupVariable(node.value))
                valid = false
    })
    return valid
}

// Sort expressions into column, row, and invalid selector expressions.
function analyzeAst(expressionListNode, lookupVariable) {

    var columnSelectors = []
    var rowSelectors = []
    var errorExpressions = []

    for (var i = 0; i < expressionListNode.expressions.length; ++i) {
        var expressionNode = expressionListNode.expressions[i]
        // ColumnSelectors are either a plain variableExpression or 
        // an unaryOperator folllowed by a variableExpression. In other
        // words, a selector for "foo" column looks like Foo +Foo -Foo.
        // 
        // Other expressions are sorted as row selecors
        var typeString = typeStringConcatVisit(expressionNode)
        var variableAccessValid = validVariableVisit(expressionNode, lookupVariable)
        
        if (!variableAccessValid) {
            errorExpressions.push(expressionNode)
        } else if (typeString == "VariableExpression" || typeString == "VariableExpressionUnaryOperator") {
            columnSelectors.push(expressionNode)
        } else {
            rowSelectors.push(expressionNode)
        }
    }
    var columns = determineColumns(columnSelectors)
    
    return {
        "includeColumns" : function() { return columns.included },
        "excludeColumns" : function() { return columns.excluded },
        "isRowSelected" : function(lookupVariable) { return evaluateBoolExpressions(rowSelectors, lookupVariable) },
        "errorExpressions" : function() { return errorExpressions },
    }
}

// Evaluate, then logical AND the expressions.
function evaluateBoolExpressions(rowSelectors, lookupVariable) {
    for (var i = 0; i < rowSelectors.length; ++i) {
        if (!evalExpressionAst(rowSelectors[i], lookupVariable))
            return false
    }
    return true
}

function firstUnaryOperatorType(rootNode) {
    var operator
    rootNode.visit(function(node) {
        if (node.type === AstType.UnaryOperator)
            operator = node.operator 
    })
    return operator
}

function firstVariableName(rootNode) {
    var variable
    rootNode.visit(function(node) {
        if (node.type === AstType.VariableExpression)
            variable = node.value
    })
    return variable
}

function determineColumns(columnSelectExpressions) {
    var ret = {
        "included" : [],
        "excluded" : [],
    }
    for (var i = 0; i < columnSelectExpressions.length; ++i) {
        var expression = columnSelectExpressions[i];
        
        var unaryOpertorType = firstUnaryOperatorType(expression)    
        var columnName = firstVariableName(expression)
        if (unaryOpertorType == "-") {
            ret.excluded.push(columnName)
        } else {
            ret.included.push(columnName)
        }
    }
    return ret
}

function evalExpressionAst(node, lookup) {
    var stack = new Array()
    stack.push(0)

    node.visit(function(thenode) {
        // console.log("visit " + thenode.type)
        if (thenode.type === AstType.Error) {
            // console.log("push Nan)
            stack.push(NaN)
        } else if (thenode.type === AstType.NumberExpression) {
            // console.log("push " + thenode.value)
            stack.push(thenode.value)
        } else if (thenode.type === AstType.VariableExpression) {
            var value = lookup(thenode.value)
            // console.log("push " + value)
            stack.push(value)
        } else if (thenode.type === AstType.StringExpression) {
            // console.log("push " + thenode.value)
            stack.push(thenode.value)
        } else if (thenode.type === AstType.UnaryOperator) {
            var expression = stack.pop()
            var result = eval(thenode.operator + "expression")
            stack.push(result)
        } else if (thenode.type === AstType.BinaryOperator) {
            var right = stack.pop()
            var left = stack.pop()
            // console.log("pop " + right)
            // console.log("pop " + left)

            var result
            switch (thenode.operator) {
                case ">" : result = left > right; break
                case "<" : result = left < right; break
                case "+" : result = left + right; break
                case "-" : result = left - right; break
                case "*" : result = left * right; break
                case "/" : result = left / right; break
                case "==" : result = left == right; break
                case "!=" : result = left != right; break
                case ">=" : result = left >= right; break
                case "<=" : result = left <= right; break
                default : result = eval("left " + thenode.operator + " right"); break; // slow path!
            }

            //console.log("push " + result)
            stack.push(result)
        }
    })

    return stack.pop()
}

function evalExpressionListAst(expressionListNode, lookup) {
    var results = []
    for (var i = 0; i < expressionListNode.expressions.length; ++i) {
        results.push(evalExpressionAst(expressionListNode.expressions[i], lookup))
    }
    return results;
}
