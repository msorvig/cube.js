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
    Operator : "operator"
}

function Lexer() {
    var m_input = ""
    var m_inputIndex = 0
    var m_token = Token.EOF
    var m_tokenValue = ""
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

    function isWhitespace (char) {
        return ((char == ' ') || (char == '\t') || (char == '\n'))
    }

    function isNumber(char) {
        return !isNaN(parseFloat(char)) && isFinite(char)
    }

    function isLetter(char) {
        return char.match(/[a-z]/i) // ### ascii only
    }
        
    function nextToken() {
        // Loop until a new token is found
      while (true) {
          // Stop on end of input.
          if (m_inputIndex >= m_input.length) {
              m_tokenValue = ""
              m_token = Token.EOF
              return Token.EOF
          }

          var char = m_input.charAt(m_inputIndex)

          // Have we built a complete identifier or number? return it.
          if ((m_mode == Token.Identifier || m_mode == Token.Number) && 
                !(isLetter(char) || isNumber(char))) {
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
                // Check if we should start building an identifer or number
                if (isLetter(char))
                    m_mode = Token.Identifier
                if (isNumber(char))
                    m_mode = Token.Number
            } 
               
            if (m_mode === Token.Operator) {
                // Return the operator
                ++m_inputIndex
                m_tokenValue = char
                m_token = char
                return char
            } else {
                // Or build identifier or number
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

        var token = nextToken()
        while (token != Token.EOF){
            tokens.push(token)
            values.push(tokenValue())
            token = nextToken()
        }

        return { "tokens" : tokens, "tokenValues" : values }
    }
    
    return {
        "Token" : Token,
        "setInput" : setInput,
        "nextToken" : nextToken,
        "token" : token,
        "tokenValue" : tokenValue,
        "lex" : lex
    }
}
