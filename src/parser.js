// An expression parser, based on the Kaleidoscope LLVM tutorial.

var AstType = {                 // Node members for type:
    Error : "Error",            // message : ""
    UnaryOperator : "UnaryOperator",        // operator : "+"/"-"
    BinaryOperator : "BinaryOperator",
    Expression : "Expression",
    ExpressionList : "ExpressionList",
    NumberExpression : "NumberExpression",     // value : 0
    VariableExpression : "VariableExpression", // value : ""
    FunctionCallExpression: "FunctionCallExpression",
}

function Parser() {
    var m_lexed = {}
    var m_position = 0
    var m_tokenCount = 0
    var m_tree = {}
    var m_current = 0

    function createAstNode(type) {
        var nnode = {
            type : type,
            description : function() { return "Node: " + type },
            visit : function(visitor) { visitor(nnode) },
        }
        return nnode
    }

    function createValueNode(type, value, tokenRange) {
        var base = createAstNode(type)
        base.value = value
        base.range = tokenRange
        return base
    }

    function createErrorNode(message, tokenRange) {
        var base = createAstNode(AstType.Error)
        base.message = message
        base.range = tokenRange
        return base
    }

    function createUnaryOperatorNode(operator, tokenRange, expression) {
        var base = createAstNode(AstType.UnaryOperator)
        base.operator = operator
        base.range = tokenRange
        base.expression = expression
        base.visit = function(visitor) { base.expression.visit(visitor); visitor(base) }
        return base
    }

    function createBinaryOperatorNode(operator, tokenRange, left, right) {
        var base = createAstNode(AstType.BinaryOperator)
        base.operator = operator
        base.left = left
        base.right = right
        base.range = tokenRange
        base.visit = function(visitor) { base.left.visit(visitor); base.right.visit(visitor); visitor(base) }
        return base
    }

    function createExpressionListNode(expressions) {
        var base = createAstNode(AstType.ExpressionList)
        base.expressions = expressions
        // visit not implemented
        return base
    }

    function createNumberExpressionNode(value, tokenRange) {
        return createValueNode(AstType.NumberExpression, value, tokenRange)
    }

    function createVariableExpressionNode(value, tokenRange) {
        return createValueNode(AstType.VariableExpression, value, tokenRange)
    }

    function createFunctionCallExpressionNode(identifier, tokenRange, expression) {
        var base = createAstNode(AstType.FunctionCallExpression)
        base.identifier = identifier
        base.range = tokenRange
        base.expression = expression
        base.visit = function(visitor) { base.expression.visit(visitor); visitor(base) }
        return base
    }


    function currentTokenValue() {
        return m_lexed.tokenValues[m_position]
    }

    function currentToken() {
        return m_lexed.tokens[m_position]
    }

    // returns token [index, length]
    function currentTokenRange() {
        var pos = m_lexed.indices[m_position]
        var nextPos = m_lexed.indices[m_position + 1]
        return [pos, nextPos - pos - 1]
    }

    function nextToken() {
        // console.log("consumed token " + m_lexed.tokenValues[m_position] + " token " + m_position + " of " + m_tokenCount)
        ++m_position;
    }

    var m_tokenPredecence = {
      '<' : 10,
      '>' : 10,
      '==' : 10,
      '>=' : 10,
      '<=' : 10,
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
        var numberExpression = createNumberExpressionNode(currentTokenValue(), currentTokenRange())
        nextToken()
        return numberExpression
    }

    function parseIdentifierExpression() {
        var identifier = currentTokenValue()
        var identifierRange = currentTokenRange();
        nextToken() // eat identifier
        if (currentToken() != "(")
            return createVariableExpressionNode(identifier, identifierRange)

        nextToken() // eat "("
        var expression = parseExpression()
        nextToken() // eat ")"
        return createFunctionCallExpressionNode(identifier, identifierRange, expression)
    }

    // parenthesesExpression -> ( expression )
    function parseParenthesesExpression() {
        nextToken() // "("
        var node = parseExpression()
        if (currentToken() != ")")
            return new createErrorNode("Expected ')'", currentTokenRange())
        nextToken() // ")"
        return node
    }

    function parseBinaryOperatorRight(expressionPrecedence, left) {
        while (1) {
            var precedence = tokenPrecedence(currentToken())
            if (precedence < expressionPrecedence)
                return left

            var operator = currentToken()
            var operatorRange = currentTokenRange()
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

            left = createBinaryOperatorNode(operator, operatorRange, left, right)
        }
    }

    function parseUnaryOperatorExpression() {
        var operator = currentToken()
        var operatorRange = currentTokenRange()
        nextToken() // eat operator
        var expression = parsePrimaryExpression()
        return createUnaryOperatorNode(operator, operatorRange, expression)
    }
/*
    function parseUnaryOperatorExpression(tokenStream) {
        return createUnaryOperatorNode(
            tokenStream.token(), tokenStream.tokenRange(), 
            parsePrimaryExpression(s.nextToken())
    }
*/

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
            default: return createErrorNode("Invalid Primary Expression token '" + currentToken() + "'", currentTokenRange)
        }
    }

    function parseExpression() {
        var left = parsePrimaryExpression()
        if (left.type === Error)
            return left

        return parseBinaryOperatorRight(0, left)
    }

    function parseExpressionList() {
        var expressions = []
        while (currentToken() !== Token.EOF) {
            expressions.push(parseExpression())
        }
        return createExpressionListNode(expressions)
    }

    function parse(lexed) {
        m_lexed = lexed
        m_position = 0
        m_tokenCount = lexed.tokens.length
        m_tree = parseExpressionList()
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

function perseQuery(query) {
    var ast  = parse(lex(query))
    return ast
}

