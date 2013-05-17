// An expression parser, based on the Kaleidoscope LLVM tutorial.

var AstType = {                 // Node members for type:
    TermList : "TermList",      // terms : []
    Term : "Term",              // value : ""
    Error : "Error",            // message : ""
    UnaryOp : "UnaryOp",        // operator : "+"/"-"
    UnaryOperator : "UnaryOperator",        // operator : "+"/"-"
    Expression : "Expression",
    NumberExpression : "NumberExpression",     // value : 0
    VariableExpression : "VariableExpression" // value : ""
}

function createAstNode(type) {
    return {
        type : type,
        description : function() { return "Node: " + type }
    }
}

function createValueNode(type, value) {
    var base = createAstNode(type)
    base.value = value
    return base
}

function createErrorNode(message) {
    return { type : AstType.Error, message : message }
}

function createUnaryOpNode(operator) {
    return { type : AstType.UnaryOperator, operator : operator }
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
            return new ErrorNode("Expected ')'")
        nextToken() // ")"
        return node
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
            default: return new ErrorNode("Invalid Primary Expression token '" + currentToken() + "'")
        }
    }

    function parseExpression(){
        return parsePrimaryExpression()
    }

    function parse(lexed) {
        m_lexed = lexed
        m_position = 0
        m_tokenCount = lexed.tokens.length

        m_tree = parsePrimaryExpression()
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
    return parse(lex(query))
}
