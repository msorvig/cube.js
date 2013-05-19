// An expression parser, based on the Kaleidoscope LLVM tutorial.

var AstType = {                 // Node members for type:
    Error : "Error",            // message : ""
    UnaryOperator : "UnaryOperator",        // operator : "+"/"-"
    BinaryOperator : "BinaryOperator",
    Expression : "Expression",
    NumberExpression : "NumberExpression",     // value : 0
    VariableExpression : "VariableExpression" // value : ""
}

function createAstNode(type) {
    var nnode = {
        type : type,
        description : function() { return "Node: " + type },
        visit : function(visitor) { visitor(nnode) }
    }
    return nnode
}

function createValueNode(type, value) {
    var base = createAstNode(type)
    base.value = value
    return base
}

function createErrorNode(message) {
    var base = createAstNode(AstType.Error)
    base.message = message
    return base
}

function createUnaryOperatorNode(operator, expression) {
    var base = createAstNode(AstType.UnaryOperator)
    base.operator = operator
    base.expression = expression
    base.visit = function(visitor) { base.expression.visit(visitor); visitor(base) }
    return base
}

function createBinaryOperatorNode(operator, left, right) {
    var base = createAstNode(AstType.BinaryOperator)
    base.operator = operator
    base.left = left
    base.right = right
    base.visit = function(visitor) { base.left.visit(visitor); base.right.visit(visitor); visitor(base) }
    return base
}

function createNumberExpressionNode(value) {
    return createValueNode(AstType.NumberExpression, value)
}

function createVariableExpressionNode(value) {
    return createValueNode(AstType.VariableExpression, value)
}

function Parser() {
    var m_lexed = {}
    var m_position = 0
    var m_tokenCount = 0
    var m_tree = {}
    var m_current = 0

    function currentTokenValue() {
        return m_lexed.tokenValues[m_position]
    }

    function currentToken() {
        return m_lexed.tokens[m_position]
    }

    function nextToken() {
        console.log("consumed token " + m_lexed.tokenValues[m_position] + " token " + m_position + " of " + m_tokenCount)
        ++m_position;
    }

    var m_tokenPredecence = {
      '<' : 10,
      '>' : 10,
      '+' : 20,
      '-' : 30,
      '/' : 40,
      '*' : 50,
    }

    function tokenPrecedence(token) {
        if (token === undefined)
            return -1
        var precedence = m_tokenPredecence[token]
        if (precedence === undefined)
            return -1
        return precedence
    }

    // numberExpression -> number
    function parseNumberExpression() {
        var numberExpression = createNumberExpressionNode(currentTokenValue())
        nextToken()
        return numberExpression
    }

    // variableExpression -> variable
    function parseVariableExpression() {
        var variableExpression = createVariableExpressionNode(currentTokenValue())
        nextToken()
        return variableExpression
    }

    function parseIdentifierExpression() {
        return parseVariableExpression()
    }

    // parenthesesExpression -> ( expression )
    function parseParenthesesExpression() {
        nextToken() // "("
        var node = parseExpression()
        if (currentToken() != ")")
            return new createErrorNode("Expected ')'")
        nextToken() // ")"
        return node
    }

    function parseBinaryOperatorRight(expressionPrecedence, left) {
        while (1) {
            var precedence = tokenPrecedence(currentToken())
            if (precedence < expressionPrecedence)
                return left

            var operator = currentToken()
            nextToken()

            var right = parsePrimaryExpression()
            if (right.type === Error)
                return right

            var nextPrecedence = tokenPrecedence(currentToken())
            if (precedence < nextPrecedence) {
                right = parseBinaryOperatorRight(precedence + 1, right)
                if (right.type === Error)
                    return right
            }

            left = createBinaryOperatorNode(operator, left, right)
        }
    }

    function parseUnaryOperatorExpression() {
        var operator = currentToken()
        console.log("unary" + operator)
        nextToken() // eat operator
        var expression = parsePrimaryExpression()
        return createUnaryOperatorNode(operator, expression)
    }

    // primaryExpression -> identifierExpression
    // primaryExpression -> numberExpression
    // primaryExpression -> parseParenthesesExpression
    function parsePrimaryExpression() {
        switch (currentToken())
        {
            case Token.Identifier : return parseIdentifierExpression()
            case Token.Number : return parseNumberExpression()
            case "(" : return parseParenthesesExpression()
            case "-" : return parseUnaryOperatorExpression()
            case "+" : return parseUnaryOperatorExpression()
            default: return createErrorNode("Invalid Primary Expression token '" + currentToken() + "'")
        }
    }

    function parseExpression() {
        var left = parsePrimaryExpression()
        if (left.type === Error)
            return left

        return parseBinaryOperatorRight(0, left)
    }

    function parse(lexed) {
        m_lexed = lexed
        m_position = 0
        m_tokenCount = lexed.tokens.length

        m_tree = parseExpression()
        return m_tree
    }

    return {
        "parse" : parse
    }
}

function lex(input) {
    var lexer = new Lexer
    return lexer.lex(input)
}

var parse = function(lexed){
    var parser = new Parser
    return parser.parse(lexed)
}

function evalAst(node, lookup) {
    var stack = new Array()
    stack.push(0)

    node.visit(function(thenode) {
        // console.log("visit " + thenode.type)
        if (thenode.type === AstType.NumberExpression) {
            // console.log("push " + thenode.value)
            stack.push(thenode.value)
        } else if (thenode.type === AstType.VariableExpression) {
            var value = lookup(thenode.value)
            // console.log("push " + value)
            stack.push(value)
        } else if (thenode.type === AstType.UnaryOperator) {
            var expression = stack.pop()
            var result = eval(thenode.operator + "expression")
            stack.push(result)
        } else if (thenode.type === AstType.BinaryOperator) {
            var right = stack.pop()
            var left = stack.pop()
            // console.log("pop " + right)
            // console.log("pop " + left)

            var result = eval("left " + thenode.operator + " right")

            //console.log("push " + result)
            stack.push(result)
        }
    })

    return stack.pop()
}
function perseQuery(query) {
    var ast  = parse(lex(query))
    var sum = evalAst(ast, function(name) { return 1 } )
    console.log("sum is " + sum)
    return ast
}

