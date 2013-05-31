// A genral lexer
//
// Usage:
//
//  var lexer = new Lexer()
//  lexer.setInput("3 + foo")
//  while (lexer.nextToken != Lexer.Token.EOF)
//      Use lexer.token and lexer.tokenValue
//

var Token = {
    EOF : "eof",
    Identifier : "identifier",  // ABC, cde24545
    Number : "number",          // 5, 9.4
    String : "string",          // "foo" or 'foo' (includes quotes)
    Operator : "operator"
}

function Lexer() {
    var m_input = ""
    var m_inputIndex = 0
    var m_token = Token.EOF
    var m_tokenValue = ""
    var m_tokenStart = 0
    var m_mode = Token.Operator
        
    function setInput(input) { 
        m_input = input + " "
        m_inputIndex = 0
    }
        
    function token() {
        return m_token
    }

    function tokenValue() { 
        if (m_token === Token.Number)
            return parseFloat(m_tokenValue)
        return m_tokenValue
    }

    function tokenIndex() {
        return m_tokenStart;
    }

    function isWhitespace (char) {
        return ((char == ' ') || (char == '\t') || (char == '\n'))
    }

    function isNumber(char) {
        return !isNaN(parseFloat(char)) && isFinite(char)
    }

    function isLetter(char) {
        return char.match(/[a-z]/i) // ### ascii only
    }

    function isQuote(char) {
        return ((char == '"') || (char == "'"))
    }
        
    function nextToken() {
        // Loop until a new token is found
      while (true) {
          // Stop on end of input.
          if (m_inputIndex >= m_input.length) {
              m_tokenStart = m_inputIndex
              m_tokenValue = ""
              m_token = Token.EOF
              return Token.EOF
          }

          var char = m_input.charAt(m_inputIndex)

          // Have we built a complete identifier, number, or string? return it.
          if ((m_mode == Token.Identifier || m_mode == Token.Number || m_mode == Token.String) &&
                !(isLetter(char) || isNumber(char) || isQuote(char))) {
                m_token = m_mode
                m_mode = Token.Operator
                return m_token
            }

            // Skip whitespace
            if (isWhitespace(char)) {
                ++m_inputIndex
                continue
            }

            if (m_mode === Token.Operator) {
                m_tokenValue = ""
                m_tokenStart = m_inputIndex
                // Check if we should start building an identifer or number
                if (isLetter(char))
                    m_mode = Token.Identifier
                else if (isNumber(char))
                    m_mode = Token.Number
                else if (isQuote(char))
                    m_mode = Token.String
            } 

            if (m_mode === Token.Operator) {
                ++m_inputIndex

                function handleDigraphOperator(value) {
                    ++m_inputIndex
                    m_tokenValue = value
                    m_token = Token.Operator
                    return m_token
                }

                // peek ahead for digraph operators
                if (char == "=" && m_input.charAt(m_inputIndex) == "=") {
                    return handleDigraphOperator("==")
                } else if (char == ">" && m_input.charAt(m_inputIndex) == "=") {
                    return handleDigraphOperator(">=")
                } else if (char == "<" && m_input.charAt(m_inputIndex) == "=") {
                    return handleDigraphOperator("<=")
                } else {
                    // Return the operator
                    m_tokenValue = char
                    m_token = char
                    return m_token
                }
            } else {
                // Or build identifier, number, or string
                m_tokenValue += char
                ++m_inputIndex
            }
        } // while
        return Token.EOF
    }
        
    function lex(input) {
        setInput(input)

        var tokens = []
        var values = []
        var indices = []

        var token = nextToken()
        do {
            tokens.push(token)
            values.push(tokenValue())
            indices.push(tokenIndex())
            token = nextToken()
        } while (token != Token.EOF)

        // push EOF token as well
        tokens.push(token)
        values.push(tokenValue())
        indices.push(tokenIndex())

        return { "tokens" : tokens, "tokenValues" : values, indices : indices }
    }
    
    return {
        "Token" : Token,
        "setInput" : setInput,
        "nextToken" : nextToken,
        "token" : token,
        "tokenValue" : tokenValue,
        "tokenIndex" : tokenIndex,
        "lex" : lex
    }
}
