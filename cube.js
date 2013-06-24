function makeCommands(env) {
    
var m_cube = {}
var m_view = {}

var commands = ["help", "load", "select", "print", "tabulate", "plot", "foreach", "selector"] // keep in sync with help text!
var takesArgs= { "help" : false, "load" : true, "select" : true, "print" : true,
                 "tabulate" : true, "plot" : true, "foreach" : true, "selector" : true}

function printHelp() {
    var text = [
        ["Available commands:" ],
        ["help        This help"],
        ["load        Load data set:         'load sales.json'"],
        ["select      Set the global query:  'select Product City'"],
        ["print       Print data list:       'print'"],
        ["tabulate    Print data table:      'print'"],
        ["plot        Plot data graph:       'plot'"],
        ["foreach     Repeat command:        'foreach Country plot Product City'"],
        ["selector    Select sub-set:        'selector Country plot Product City'"],
    ]
    return createContainerWidget(text.map(function(textLine){ return createTextWidget(textLine) }))
}

function createTextWidget(text) {
    return createHtmlWidget(undefined, env.createTextNode.bind(env, text))
}

function load(filePath) {
    var widgets = []
    function loadComplete(data) {
        m_cube = makeCube(makeTableView(makeTable(data)))
        widgets.push(createTextWidget("Load OK: "+ filePath))
        widgets.push(select(""))
    }
    function error(code) {
        result.push(createTextWidget(filePath + ": " + code ))
    }

    syncGetJson(filePath, loadComplete, error)
    return createContainerWidget(widgets)
}

function selectOnView(query, view) {
    return makeCube(view).select(query)
}

function select(query) {
    m_view = m_cube.select(query)
    return createContainerWidget([
        createTextWidget("Columns " + m_view.columnIds().join(" ")),
        createTextWidget("Rows " + m_view.rowCount()),
    ])
}

function print(query, view) {
    return createListWidget(view, selectOnView.bind(this, query), env.styleTable)
}

function tabulate(query, view) {
    return createTableWidget(view, selectOnView.bind(this, query), env.styleTable)
}

function plot(query, view) {
    return createHighChartWidget(view, selectOnView.bind(this, query))
}

// repeats the subcommand for all unique values in a dimension
function foreach(query, view) {
    var parts = query.split(" ")
    var repeatDimension = parts[0]
    var subCommand = parts.slice(1).join(" ")

    return createSubViewWidget(view, repeatDimension, switchCommand.bind(this, subCommand), createTextWidget)
}

// Displays a button group for all unique values in a dimension, runs
// the subcommand for the selected one.
function selector(query, view) {
    var parts = query.split(" ")
    var selectDimension = parts[0]
    var subCommand = parts.slice(1).join(" ")

    return createViewSelectorWidget(view, selectDimension, switchCommand.bind(this, subCommand))
}

// runs a command from the command line with a view and returns a widget
function switchCommand(commandLine, view) {
    if (commandLine.indexOf("help") == 0) {
        return printHelp()
    } else if (commandLine.indexOf("'help'") == 0) {
        return createTextWidget("Try help (without the quotes)")
    } else if (commandLine.indexOf("load") == 0) {
        var filePath = commandLine.substring(5) // everything after "load "
        return load(filePath)
    } else if (commandLine.indexOf("select ") == 0) {
        var query = commandLine.substring(7)
        return select(query)
    } else if (commandLine.indexOf("print") == 0) {
        var query = commandLine.substring(6)
        return print(query, view)
    } else if (commandLine.indexOf("tabulate") == 0) {
        var query = commandLine.substring(9)
        return tabulate(query, view)
    } else if (commandLine.indexOf("plot") == 0) {
        var query = commandLine.substring(5)
        return plot(query, view)
    } else if (commandLine.indexOf("foreach") == 0) {
        var query = commandLine.substring(8)
        return foreach(query, view)
    } else if (commandLine.indexOf("selector") == 0) {
        var query = commandLine.substring(9)
        return selector(query, view)
    } else {
        if (commandLine.length > 0)
        return createTextWidget("Unknown command: " + commandLine)
    }
}
return {
    switchCommand : switchCommand,
    commands : function() { return commands },
    takesArgs : function() { return takesArgs },
    view : function() { return m_view },
}

}

// Uses a table view as a data source and further filters the data using a query.
function makeTableCube(tableView)
{
    var view = tableView;
    var semantic = {}
    if (view === undefined) {
        console.log("Error: TableCube constructed with null view")
        return undefined
    }

    function select(query)
    {
        //console.log("select " + query)

        // Parse and analyze query
        var ast = parse(query)
        var isValidVariable = function(variableName) { return view.columnIds().indexOf(variableName) != -1 }
        semantic = analyzeAst(ast, isValidVariable)

        // Print expressions with errors
        for (var i = 0; i < semantic.errorExpressions().length; ++i) {
            console.log("invalid expression")
            console.log(semantic.errorExpressions()[i])
        }

        // select columns: all dimensions, and measures as determined by the query
        var measures = selectColumns(view.measureIds(), semantic.includeColumns(), semantic.excludeColumns())
        var columns = view.dimensionIds().concat(measures)
        var columnIndexes = lookupColumns(columns)

        // select rows as determined by the query
        var rowRange = selectRows(view, semantic)
        // the base view is a filtered view to the fact table
        var baseView = makeTableView(view.table(), rowRange, columnIndexes)

        // determine dimensions based on the query
        var dimensions = selectColumns(view.dimensionIds(), semantic.includeColumns(), semantic.excludeColumns())
        var dimensionIndexes = lookupColumns(dimensions)

        // return the base view if all dimensions are selected - no cube computation in this case
        if (dimensions.length == view.dimensionIds().length)
            return baseView

		var rowExpressionKey = semantic.rowExpressionsString()

        // compute cube(s)
        var cubeView = computeCubesForApex(dimensionIndexes, baseView, rowExpressionKey)
        return cubeView
    }

	// Returns the iterms that are both in array1 and array2
    function intersect(array1, array2) {
        return array1.filter(function(item) {
            return (array2.indexOf(item) != -1)
        })
    }

	// Selects columns. include/exclude bases on includeColumns and excludeColumns
	// As a special case, including no columns selects all coulumns
    function selectColumns(allColumns, includeColumns, excludeColumns) {
        var columns = []

        // start with the included columns, or all columns if
        // none are in the include array.
        if (intersect(allColumns, includeColumns).length > 0)
            columns = includeColumns
        else
            columns = allColumns

        // remove excluded columns
        for (var i = 0; i < excludeColumns.length; ++i)
            columns.splice(columns.indexOf(excludeColumns[i]), 1)

        return columns
    }

    // columnId -> columnIndex
    function lookupColumns(columnIds) {
        return columnIds.map(function(columnId) {
             return view.lookupColumn(columnId)
        })
    }

    function selectRows(view, semantic) {
        var rangeBuilder = RangeBuilder()

        // run the query expressions on each row
        view.foreach(function(rowIndex){
            var columnValueLookup = function(column) { return view.row(rowIndex)[column] }
            if (semantic.isRowSelected(columnValueLookup))
                rangeBuilder.add(rowIndex, 1)
        })

        return rangeBuilder.range()
    }

	// Compute the cube "pyramid". For example:
    // Dimenssions: A - B - C
    // Cubes:                 []
    //          [A]          [B]              [C]
    //     [A,B]  [A,C] [B,A], [B, C]   [C, B], [C, A]
	//
	// Cube computation starts top-down at the "apex" dimention(s),
	// which can for example be [A] or [A,B] (depending on the query)
	//
	// Computed cubes and sub-cubes are cached.
	//
	// TODO: support computing the top "[]" cube
	//
	var m_cubeCaches = {}
	var m_key = ""	// active cache key
	var m_ranges   // cube name -> row range
	var m_cubeTable
    function computeCubesForApex(apexDimensions, view, rowExpressionKey){

		// Set up cube cache. Since a query might select a subset of all rows
		// each distinct query needs a separate cache, keyed on rowExpressionKey.
		// Each cache entry contains a table for storing computed cube rows and
		// ranges for the individual cubes.
		m_key = rowExpressionKey
		if (m_cubeCaches[m_key] === undefined)
			m_cubeCaches[m_key] = { range : {}, table : makeTable(view.columns()) }

		var cubeCache = m_cubeCaches[m_key]
		m_ranges = cubeCache.range
		m_cubeTable = cubeCache.table

        var allDimensions = view.dimensionIndexes()

        if (apexDimensions.length == allDimensions.length)
            return view

        computeCubesForApexHelper(view, apexDimensions, allDimensions)
        var cubeRange = m_ranges[canonicalCubeName(apexDimensions)]
        return makeTableView(m_cubeTable, cubeRange, apexDimensions.concat(view.measureIndexes()))
    }

    function computeCubesForApexHelper(view, apexDimensions, allDimensions) {
        if (apexDimensions === undefined)
            return

        var cubeName = canonicalCubeName(apexDimensions)
        if (m_ranges[cubeName] !== undefined) {
            return m_ranges[cubeName] // already computed
        }

        // recurse to subcubes
        var shellCubes = true
        var rollups = rollupDimensions(apexDimensions, allDimensions)
        var rollupDimension = undefined
        if (rollups.length == 0)
            return

        // if iceberg then compute a minimal set of cubes for the given apex cube.
        if (shellCubes) {
            // check if we can re-use a cube by rolling up a spesific dimension
            rollups.forEach(function(rollup) {
                var subName = canonicalCubeName(apexDimensions.concat(rollup))
                if (m_ranges[cubeName] !== undefined) {
                    rollupDimension = rollup // found cached cube
                }
            })

            if (rollupDimension === undefined) {
                // no cached cube found, roll up the first dimension
                rollupDimension = rollups[0]
                var subCube = apexDimensions.concat(rollupDimension)
                computeCubesForApexHelper(view, subCube, allDimensions)
            }
        } else {
            // compute all sub-cubes
            rollups.forEach(function(rollup) {
                var subApex = apexDimensions.concat(rollup)
                computeCubesForApexHelper(view, subApex, allDimensions)
            })
            rollupDimension = rollups[0] // roll up the first dimension
        }

        // computing a subcube might have computed this cube as a side effect:
        if (m_ranges[cubeName] !== undefined) {
            return m_ranges[cubeName]
        }

        // returning from recursion, now compute *this* cube which we can do by
        // rolling up the dimension we previosly compuded a subcube for.
        m_ranges[cubeName] = computeCubeRows(view, apexDimensions, rollupDimension)
        return m_ranges[cubeName]
    }

    function computeCubeRows(view, apexDimensions, rollupDimension) {

		var acc_rangeBuilders = {} // cube name -> RangeBuider

        // visit the view "cells" (the combinations of dimension values) and accumulate measures
        view.visitCells(apexDimensions,
            function(view, dimensions, values) {
                // leaf. This accumulates rows for the target cube.
                accumulateRows(view, dimensions, values)
        },  function(view, dimensions, values) {
                // interior. This accumulates rows for "higher" cubes and is optional. 
				// Pro: The views have already been generated
				// Con: measures will be (re)-accumulated from the base fact table,
				// duplicating work
                accumulateRows(view, dimensions, values)
        })

        // finalize: create views from range builders
        for (key in acc_rangeBuilders) {
            m_ranges[key] = acc_rangeBuilders[key].range()
        }

        return m_ranges[canonicalCubeName(apexDimensions)]

        function accumulateRows(view, dimensions, values) {
            var acc_row = {}

            // copy dimensions
            dimensions.forEach(function(dim, index) {
                acc_row[view.column(dim).id] = values[index]
            })

            // accumulate each measure
            view.foreach(function(rowIndex) {
                view.measureIds().forEach(function(measure) {
                    if (acc_row[measure] == undefined)
                        acc_row[measure]  = 0
                    acc_row[measure] += view.row(rowIndex)[measure]
                })
            })

            // add row to table and the row index ot the cube's view.
            var cubeName = canonicalCubeName(dimensions)
            var rowIndex = m_cubeTable.addRow(acc_row)
            if (acc_rangeBuilders[cubeName] === undefined) {
               acc_rangeBuilders[cubeName] = RangeBuilder()
           }
           acc_rangeBuilders[cubeName].add(rowIndex, 1)
        }

    }

    function rollupDimensions(apexDimensions, allDimensions) {
        return allDimensions.filter(function(dim){ return apexDimensions.indexOf(dim) == -1 })
    }

    function subCubes(apexDimensions, allDimensions) {
        if (allDimensions.length - apexDimensions.length == 1)
            return []
        var restDimensions = allDimensions.filter(function(dim){ return apexDimensions.indexOf(dim) == -1 })
        var subCubes = []
        restDimensions.forEach(function(dim) {
            subCubes.push(apexDimensions.concat([dim]))
        })
        return subCubes
    }

    function canonicalCubeName(dimensions) {
        return dimensions.slice(0).sort().join(" ") // sort: ABC is the same cube as BAC
    }

    return { "select" : select ,
             "subCubes" : subCubes,
    }
}

function makeCube(view)
{
    return makeTableCube(view)
}

function cubeSelect(view, query) {
    return makeCube(view).select(query)
}
function makeCubeAPI() {
    var env = {
        createTextNode : function (text) {
            return document.createTextNode(text)
        },
        styleTable : function (table) {
		    $(table).addClass("table table-condensed table-striped table-bordered")
            return table
        }
    }
    
    var commands = makeCommands(env)
    
    function load(url, callback) {
        console.log("load " + url)
        commands.switchCommand("load " + url, commands.view())
    }
    
    function runCommand(command, callback) {
        var result = commands.switchCommand(command, commands.view())
        var rendered = result.render()
        return rendered
    }
    
    return {
        load : load,
        runCommand : runCommand
    }
}
function getJson_impl(url, callback, error, async) {
    var request = new XMLHttpRequest();
    request.onload = function(e) {
        if (request.status == 200) {
            callback(JSON.parse(request.responseText))
        } else {
            console.log("getJson: Error opening " + url + " Status: " + request.status)
            if (error != undefined) {
                error(request.status)
            }
        }
    };
    request.open("get", url, async);
    request.send();
}

function getJson(url, callback, error) {
    getJson_impl(url, callback, error, true)
}

function syncGetJson(url, callback, error) {
    getJson_impl(url, callback, error, false)
}

function syncGet(url) {
    var obj
    syncGetJson(url, function(data) {
        obj = data
    })
    return obj
}

function loadData(dataUrl, callback)
{
    getJson(dataUrl + '/data.json' , callback)
}

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
                } else if (char == "!" && m_input.charAt(m_inputIndex) == "=") {
                    return handleDigraphOperator("!=")
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
// An expression parser, based on the Kaleidoscope LLVM tutorial.

var AstType = {                 // Node members for type:
    Error : "Error",            // message : ""
    UnaryOperator : "UnaryOperator",        // operator : "+"/"-"
    BinaryOperator : "BinaryOperator",
    Expression : "Expression",
    ExpressionList : "ExpressionList",
    NumberExpression : "NumberExpression",     // value : 0
    VariableExpression : "VariableExpression", // value : ""
    StringExpression : "StringExpression",     // value : ""
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

    function createStringExpressionNode(value, tokenRange) {
        var unquoted = value.substring(1, value.length - 1) // strip quotes (lexer doesn't)
        return createValueNode(AstType.StringExpression, unquoted, tokenRange)
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
      '!=' : 10,
      '>=' : 10,
      '<=' : 10,
      '+' : 20,
      '-' : 30,
      '/' : 40,
      '*' : 50,
    }

    function tokenPrecedence(token) {
        var precedence = -1
        if (token !== undefined)
            precedence = m_tokenPredecence[token]
        if (precedence === undefined)
            precedence = -1
        return precedence
    }

    function parseError(reason) {
        var token = currentTokenValue()
        var range = currentTokenRange()
        nextToken()
        return createErrorNode("Parse Error: " + reason + " For '" + token + "' At " + range, range)
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

    function parseStringExpression() {
        var stringExpression = createStringExpressionNode(currentTokenValue(), currentTokenRange())
        nextToken()
        return stringExpression
    }

    // parenthesesExpression -> ( expression )
    function parseParenthesesExpression() {
        nextToken() // "("
        var node = parseExpression()
        if (currentToken() != ")")
            return parseError("Expected ')'")
        nextToken() // ")"
        return node
    }

    function parseBinaryOperatorRight(expressionPrecedence, left) {
        while (1) {
            var precedence = tokenPrecedence(currentTokenValue())
            if (precedence < expressionPrecedence)
                return left

            var operator = currentTokenValue()
            var operatorRange = currentTokenRange()
            nextToken()

            var right = parsePrimaryExpression()
            if (right.type === Error)
                return right

            var nextPrecedence = tokenPrecedence(currentTokenValue())
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
            parsePrimaryExpression(tokenStream.next(),
            tokenStream.token(), tokenStream.tokenRange())
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
            case Token.String : return parseStringExpression()
            case "(" : return parseParenthesesExpression()
            case "-" : return parseUnaryOperatorExpression()
            case "+" : return parseUnaryOperatorExpression()
            default : return parseError("Invalid primary expression token")
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
            var pos = m_position
            expressions.push(parseExpression())
            if (pos == m_position) {
                console.log("Parser error: stuck on token " + currentTokenValue())
                break; // break to prevent infinite loop
            }
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

function parse(string) {
    var lexer = new Lexer
    var parser = new Parser
    var ast = parser.parse(lexer.lex(string))
    ast.string = string
    return ast
}

function Range() {
    if (arguments.length < 1)
        console.log("ERROR: Range expects one argument")
    if (arguments[0] === undefined)
        return undefined

    var m_range = []

    if (arguments.length == 1) {
        m_range = arguments[0]
    } else if (arguments.length == 2) {
        m_range = [[arguments[0], arguments[1]]]
    }

    function isEmpty() {
        return m_range.length == 0 || (m_range[0][0] == 0 && m_range[0][1] == 0)
    }

    function contains(testpos, testlen) {
        if (testlen === undefined)
            testlen = 1
        // check if the test range is contained in a single sub-range (assumes merged sub-ranges)
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]
            if (pos <= testpos && testpos + testlen <= pos + len)
                return true
        }
        return false
    }

    function forEach(functor) {
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]
            for (var j = pos; j < pos + len; ++j) {
                functor(j)
            }
        }
    }

    function map(functor) {
        var array = []
        forEach (function(index) {
            array.push(functor(index))
        })
        return array
    }

    function filter(prediacte) {
        var array = []
        forEach (function(index) {
            if (prediacte(index))
                array.push(index)
        })
        return array
    }

    function filtered(prediacte) {
        var builder = RangeBuilder()
        forEach (function(index) {
            if (prediacte(index))
                builder.add(index, 1)
        })
        return builder.range()
    }

    function toString() {
        return m_range.toString()
    }

    return  {
        "isEmpty" : isEmpty,
        "contains" : contains,
        "forEach" : forEach,
        "map" : map,
        "filter" : filter,
        "filtered" : filtered,
        "toString" : toString,
    }
}

function RangeBuilder() {
    if (arguments.length > 2)
        console.log("ERROR: makeRange expects at most 2 arguments")

    var initPos = arguments[0] || 0
    var initLen = arguments[1] || 0
    var m_range = [[initPos, initLen]] // array of [pos, len]

    function _mergeRange(index) {
        //console.log("merge " + index + " " + m_range.length)

        var lenincrement = 0
        var pos = m_range[index][0]
        var len = m_range[index][1]

        for (var i = index + 1; i < m_range.length; ++i) {
            var mergepos = m_range[i][0]
            var mergelen = m_range[i][1]

            //console.log("mergepos " + mergepos + " mergelen" + mergelen)

            if (mergepos > pos + len) 
                break;

            //console.log("range++ " +  ((mergepos + mergelen) - (pos + len)))

            if (mergepos + mergelen >= pos + len)
                m_range[index][1] += ((mergepos + mergelen) - (pos + len))

            m_range.splice(i, 1)
            --i;
        }
    }

    function add(newpos, newlen) {
        // find the insertion point
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]

            // skip sub-ranges before the current range
            if (pos + len < newpos)
                continue

            // extend the current sub-range if there is an overlap
            //console.log(pos + " " + newpos + " " + (pos + len))
            if (pos <= newpos && newpos <= pos + len) {
                // extend with the non-overlapping part of the new range
                m_range[i][1] += Math.max(0, newlen - (pos + len - newpos))
                //console.log(m_range[i][0])
                //console.log(m_range[i][1])

                _mergeRange(i)
                return
            }

            // check if the new range is before the current sub-range
            if (newpos < pos)
                break
        }
        // no existing sub-range found, insert/append new range
        m_range.splice(i, 1, [newpos, newlen])
        _mergeRange(i)
    }

    function range() {
        return Range(m_range)
    }

    return  {
        "add" : add,
        "range" : range,
    }
}


function HighchartsDataProvider(view) {
    var m_dimensions = view.dimensionIds()
    if (m_dimensions.length < 1) {
        console.log("HighchartsRenderer needs two dimentions")
    }
    // Categories are the (unique) values of the first dimention
    var categoriesDimension = m_dimensions[0];
    var m_categories = view.uniqueValues(categoriesDimension)

    // Series are the (unique) values in of second dimention
    var seriesDimension = m_dimensions[1];

    // Use the first measure by default
    var m_measures = view.measureIds()
    var m_measure = m_measures[0];

    function title() {
        return m_measure
    }

    function categories() {
        return m_categories;
    }

	function categoriesTitle() {
		return categoriesDimension;
	}

    function serie(view) {
        return view.values(m_measure)
    }

    function series() {

        var s = []
        view.forEachSubView(seriesDimension, function(key, makeview) {
			s.push({ name : key,
                     data : serie(makeview()) })
        })
        return s

    }

	function measureUnit() {
		return m_measure
	}

	function legendEnabled() {
		return seriesDimension !== undefined
	}

    return {
        title : title,
        categories : categories,
		categoriesTitle : categoriesTitle,
        series : series,
		measureUnit : measureUnit,
		legendEnabled: legendEnabled,
    }
}

function createHighChart(view) {
    var dataProvider = HighchartsDataProvider(view)
    var target = $("<div>")
    target.highcharts({
        chart: {
            type: 'bar',
        },
        title: {
            text: dataProvider.title()
        },
        xAxis: {
            categories: dataProvider.categories(),
            title: {
                text: dataProvider.categoriesTitle()
            }
        },
        yAxis: {
            title: {
                text: dataProvider.measureUnit()
            }
        },
        series : dataProvider.series(),
		legend : { enabled : dataProvider.legendEnabled() },
		plotOptions: {
            bar: { animation: false }
        },
    });
    return target
}

function createHighChartWidget(view, queryFunction) {
    return createHtmlWidget(view, function(view) { return createHighChart(queryFunction(view)) })
}
function createSelector (values, selected) {
    var m_selected = selected
    var m_values = values
    var m_onChangeCallback
    var m_container = $("<div>")

    function setValues(values, selected) {
        m_selected = selected
        m_values = values
        m_container.empty()
        m_container.append(renderHelper())
    }

    function changeSelection(selected) {
        if (selected == m_selected)
            return

        m_selected = selected
        m_container.empty()
        m_container.append(renderHelper())

        if (m_onChangeCallback !== undefined)
            m_onChangeCallback(selected)
    }

    function setCallback(onChangeCallback) {
        m_onChangeCallback = onChangeCallback
    }

    function render() {
        m_container.empty()
        m_container.append(renderHelper())
        return m_container
    }

    function renderHelper() {
        var page = $("<div class='pagination'>")
        var ul = $("<ul>")
        page.append(ul)

        m_values.forEach(function(value) {
            var a  =$("<a href=#> " + value + "</a>")
            a.click(function(event) {
                event.preventDefault()
                changeSelection(value)
            })
            var li = $("<li>")
            li.append(a)
            if (value == m_selected)
                li.addClass("active")
            ul.append(li)
        })
        return page
    }

    return {
        setCallback : setCallback,
        render : render,
        setValues : setValues,
    }
}

function createViewSelectorWidget(view, dimension, createSubWidgetCallback) {
    var viewMakers = { }
    var container = $("<div>")
    var values = []
    var selected

    updateHelper(view)

    var selector = createSelector(values, selected)
    var view = viewMakers[selected]()
    var subWidget = createSubWidgetCallback(view)

    selector.setCallback(function(selectedValue){
        selected = selectedValue
        subWidget.update(viewMakers[selected]())
    })

    function render() {
        container.append(selector.render())
        container.append(subWidget.render())
        return container
    }

    function update(view) {
        updateHelper(view)
        selector.setValues(values, selected)
        subWidget.update(viewMakers[selected]())
    }

    function updateHelper(view) {
        values = []
        viewMakers = { }

        view.forEachSubView(dimension, function(value, makeView) {
            values.push(value)
            viewMakers[value] = makeView
        })
        if (values.indexOf(selected) ==-1)
            selected = values[0]
    }

    return { render: render, update: update }
}// view->html "table-list" (1D table)
function createListHtml(view)
{
    // header
    var table = $("<table>")
    var head = table.append($("<thead>"))
    var tr = $("<tr/>¨")
    head.append(tr)
    view.columnIds().forEach(function(value) {
        tr.append("<th>" + value + "</th>")
    })
    
    // rows
    view.foreach(function(index) {
        var tr = $("<tr/>")
        table.append(tr)
        view.columnIds().forEach(function(header) {
            tr.append("<td>" + view.row(index)[header] + "</td>")
        })
    })
    return table
}

function createListWidget(initialView, queryFunction, styleFunction) {
    function htmlFunction(view) {
        return styleFunction(createListHtml(queryFunction(view)))
    }
    return createHtmlWidget(initialView, htmlFunction)
}

function TableDataProvider(view) {
	var m_dimensions = view.dimensionIds()

    // Headers are the (unique) values of the first dimention
    var categoriesDimension = m_dimensions[0];
    var m_categories = view.uniqueValues(categoriesDimension)

    // Rows are the (unique) values in of second dimention
    var seriesDimension = m_dimensions[1];

    // Use the first measure by default
    var m_measures = view.measureIds()
    var m_measure = m_measures[0];

    function title() {
        return m_measure
    }

    function headers() {
        return m_categories;
    }

	function headersTitle() {
		return categoriesDimension;
	}

    function row(view) {
        return view.values(m_measure)
    }

    function rows() {

        var s = []
        view.forEachSubView(seriesDimension, function(key, makeview) {
			s.push({ name : key,
                     data : row(makeview()) })
        })
        return s
    }

	function measureUnit() {
		return m_measure
	}

	function is1D() {
		return seriesDimension === undefined
	}

    return {
        title : title,
        headers : headers,
		headersTitle : headersTitle,
        rows : rows,
		measureUnit : measureUnit,
		is1D : is1D,
    }
}


// view->html table (1D / 2D table)
function createTableHtml(view)
{
	dataProvider = TableDataProvider(view)

    // header
    var table = $("<table>")
    var head = $("<thead>")
    table.append(head)
    var tr = $("<tr/>¨")
    head.append(tr)
    if(!dataProvider.is1D())
		tr.append("<th></th>") // blank upper left cell
    dataProvider.headers().forEach(function(value) {
        tr.append("<th>" + value + "</th>")
    })

    // rows
    dataProvider.rows().forEach(function(row) {
        var tr = $("<tr/>")
        table.append(tr)
    	if(!dataProvider.is1D())
        	tr.append("<th>" + row.name + "</th>")
        dataProvider.headers().forEach(function(header, index) {
            var value = row.data[index]
            if (value === undefined) {
                value = 0
            }
            tr.append("<td>" + value + "</td>")
        })
    })
    return table
}

function createTableWidget(initialView, queryFunction, styleFunction) {
    function htmlFunction(view) {
        return styleFunction(createTableHtml(queryFunction(view)))
    }
    return createHtmlWidget(initialView, htmlFunction)
}

// = Widget =
//    Widget is an interface for UI components that display table
//    views and respond to view updates.
//
//    Widget Interface:
// 
//    * render() -> root html element
//    * update(view)
//
//   render() is called once at "show" time. update(view) is called when there
//   is a view udpate with a new view. The widget should update its html ouput
//   at this  point. Render is not called again.

// = HtmlWidget =
// HtmlWidget wraps an html producer in a widget.
//
// {{{ initialView  [TableView] }}} The initial data view\\
// {{{htmlFunction(view) -> html }}}  UI producer function
//
// {{{htmlFunction}}} is called on render() and update().
//
function createHtmlWidget(initialView, htmlFunction) {
    var container = $("<div>")
    
    function render() {
        container.append(htmlFunction(initialView))
        return container
    }
    
    function update(newView) {
        var newHtml = htmlFunction(newView)
        container.empty()
        container.append(newHtml)
    }
    return { render: render, update: update }
}

// = ContainerWidget =
//
// Containerwidgets contain one or more child widgets.
//
// {{{widgets [Array]}}}  Child widgets to wrap
//
// Containerwidgets contain one or more child widgets and adds the html for
// the sub-widgets in a <div> element. update() calls are forwarded to child
// widgets.
function createContainerWidget(widgets) {
    function render() {
        var container = $("<div>")
        widgets.forEach(function(widget) { 
            container.append(widget.render())
        })
        return container
    }
    
    function update(view) {
        widgets.forEach(function(widget){ widget.update(view) })
    }
    return { render: render, update: update }
}

// = SubViewWidget =
//
// SubViewWidget instansiates and contains sub-widgets for all unique values in a
// dimension.
//
// {{{view [TableView]}}}  The initial data view\\
// {{{dimension [String]}}} The dimension to create subview widgets on\\
// {{{createCallback(view) -> Widget}}} A constructor function that creates
// a (sub-) widget for a view\\
// {{{createLabelCallback(value) -> Widget}}} A constructor function that
// creates a label for a view. (optional)
//
function createSubViewWidget(view, dimension, createCallback, createLabelCallback) {
    var widgets = {}
    function render() {
        var container = $("<div>")
        view.forEachSubView(dimension, function(val, makeView) {
            var widget = createCallback(makeView())
            widgets[val] = widget
            if (createLabelCallback)
                container.append(createLabelCallback(val))
            container.append(widget.render())
        })
        return container
    }
    
    function update(view) {
        view.forEachSubView(dimension, function(val, makeView) {
            if (widgets[val] === undefined) {
                console.log("update no widget for " +  val)
            } else {
                widgets[val].update(makeView())
            }
        })
    }
    return { render: render, update: update }
}

function createSubViewRepater(view, dimension, callback) {
    var container = $("<div>")
    view.forEachSubView(dimension, function(val, makeView) {
        container.append(callback(makeView(), val))
    })
    return container
}




    
    function Repl(hostEnvironment, commandEnvironment) {
    var env = hostEnvironment

    var tabCompleteIndex = -1
    var typedPrefix = ""

    var history = []
    var historyIndex = -1
    var maxRestoredhistoryLength = 50

    // load previous history
    if (typeof(localStorage) != "undefined" ) {
        var json = localStorage.getItem("history")
        if (json !== null) {
            history = JSON.parse(json);
            // limit the number of history items
            history.splice(0, Math.max(0, history.length - maxRestoredhistoryLength))
        }
    }

    function pushHistory(commandLine) {
        history.push(commandLine)
        // store history
        if (typeof(localStorage) != "undefined" ) {
            try { localStorage.setItem("history", JSON.stringify(history)) }
            catch (e) { if (e == QUOTA_EXCEEDED_ERR) localStorage.removeItem("history") }
        }
    }

    function createTextWidget(text) {
        return createHtmlWidget(undefined, env.createTextNode.bind(env, text))
    }

    function processCommand(commandLine) {
        env.setInputPlaceholderText("") // remove help message after first input

        historyIndex = -1 // reset history navigation
        if (commandLine.length > 0)
            pushHistory(commandLine)

        typedPrefix = "" // reset tab completion

        env.appendNode(createTextWidget("> " + commandLine).render())
        env.appendNode(commandEnvironment.switchCommand(commandLine, commandEnvironment.view()).render())
        env.appendNode(createTextWidget(" ").render())
    }

    function textChanged() {
        var value = env.getInputText()
        env.setInputText("")
        processCommand(value)
    }

    function navigateHistory(delta) {
        if (history.length == 0)
            return // no history

        // clamp to history range and return on no change
        var newIndex = Math.max(Math.min(history.length -1, historyIndex + delta), 0)
        if (newIndex == historyIndex)
            return;

        historyIndex = newIndex
        var item = history[history.length - historyIndex - 1] //
        env.setInputText(item)
    }

    function tabCompleteCommand() {
        if (typedPrefix == "")
            typedPrefix = env.getInputText()
        if (typedPrefix == "")
            return

        var candidates = commandEnvironment.commands().filter(function(command) {
            return command.indexOf(typedPrefix) == 0
        })
        if (candidates.length == 0)
            return

        ++tabCompleteIndex;
        var candidateIndex = tabCompleteIndex % candidates.length
        var candidate = candidates[candidateIndex]
        if (commandEnvironment.takesArgs()[candidate])
            candidate += " "
        env.setInputText(candidate)
    }

    function resetTypedPrefix() {
        typedPrefix = ""
    }

    function clearInput(){
        typedPrefix = ""
        tabCompleteIndex = -1
        historyIndex = -1
        env.setInputText("")
    }

    function keyDown(event) {
        // console.log(event.keyCode)
        switch(event.keyCode) {
            case 9 :
                event.preventDefault(); // grab the tab keypress. Evil!
                tabCompleteCommand();
            break;
            case 13 : textChanged(); break; // onchange not triggered from programatic update, handle enter key here
            case 27 : clearInput(); break; // esc
            case 38 : navigateHistory(+1); break; // key up
            case 40 : navigateHistory(-1); break; // key down
            default : resetTypedPrefix(); break; // reset tab completion prefix on typing
        }
    }

    return {
        textChanged : textChanged,
        keyDown : keyDown,
    }
}
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

function stringRangeVisit(rootNode) {
	var max = Number.MIN_VALUE
	var min = Number.MAX_VALUE

    rootNode.visit(function(node) {
		if (node.range === undefined)
			return
		// node.range is [pos, len]
		max = Math.max(max, node.range[0] + node.range[1])
		min = Math.min(min, node.range[0])
    })
    return [min, max - min] // return [pos, len]
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

	var rowExpressionsString = ""
	rowSelectors.forEach(function(node) {
		var fullRange = stringRangeVisit(node)
		rowExpressionsString += expressionListNode.string.slice(fullRange[0], fullRange[0] + fullRange[1])
	})
    
    return {
        "includeColumns" : function() { return columns.included },
        "excludeColumns" : function() { return columns.excluded },
        "isRowSelected" : function(lookupVariable) { return evaluateBoolExpressions(rowSelectors, lookupVariable) },
        "errorExpressions" : function() { return errorExpressions },
		"rowExpressionsString" : function() { return rowExpressionsString },
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
/*
    http://www.dataprotocols.org/en/latest/json-table-schema.html

    Table: {
        schema {
            fields [
                { "id" : , "label" : "kind" : }
            ]
        }
        rows [
            { "fieldId" : value }
        ]
    }
*/

// Constructor 1 : makeTable(ids, labels, kinds)
// Constructor 2: function makeTabe(tableHeader)
// Constructor 3: function makeTabe(tableData)
// ### factor 1 into tableBuilder?
function makeTable(ids, labels, kinds) {
    var table = {}
    if (ids.schema !== undefined && ids.rows !== undefined) {
        // hackety -- a table JSON data structure was passed. Use it.
        table = ids
    } else if (ids.length !== undefined && ids[0].id != undefined) {
        // array of fields
        table = {
            "schema" : { "fields" : ids },
            "rows": []
        }
    } else {
        table = {
            "schema" : { "fields" : makeFields(ids, labels, kinds) },
            "rows" : []
        }
    }
    function makeFields(ids, labels, kinds) {
        var definedIds = ids // id is mandatory
        var definedLabels = labels || [] // optional
        var definedkinds = kinds || [] // optional
        var fields = []

        for (var i = 0; i < definedIds.length; ++i) {
            fields.push({ "id" : definedIds[i],
                          "label" : definedLabels[i],
                          "kind" : definedkinds[i] })
        }
        return fields
    }

    function addRow(row) {
        table.rows.push(row)
        return table.rows.length - 1
    }

    function rowCount() {
        return table.rows.length
    }

    function row(index) {
        return table.rows[index]
    }

    function fieldCount() {
        return table.schema.fields.length
    }

    function field(index) {
        return table.schema.fields[index];
    }

    function fieldAttribute(index, attribute) {
        table.schema.fields[index][attribute]
    }

    function fieldAttributes(attribute) {
        return table.schema.fields.map(
            function(field){ return field[attribute] }
        )
    }

    function fieldIds() {
        return fieldAttributes("id")
    }

    function fieldLabels() {
        return fieldAttributes("label")
    }

    function fieldKinds() {
        return fieldAttributes("kind")
    }

    function fields() {
        return table.schema.fields;
    }

    function filterFields(fieldIds) {
        return table.schema.fields.filter(
            function(field) { return (fieldIds.indexOf(field) != -1) }
        )
    }

    function indexOfField(fieldId) {
        return table.schema.fields.forEach(function(field, index){
            if (field.id == fieldId)
                return index;
        })
        return -1
    }

    function cell(rowIndex, column) {
        if (typeof column === "number")
            return table.rows[rowIndex][field(column).id]
        else
            return table.rows[rowIndex][column]
    }

    return {
        "addRow" : addRow,
        "rowCount" : rowCount,
        "row" : row,
        "field" : field,
        "fieldCount" : fieldCount,
        "fieldIds" : fieldIds,
        "fieldLabels" : fieldLabels,
        "fieldKinds" : fieldKinds,
        "fields" : fields,
        "filterFields" : filterFields,
        "cell" : cell
    }
}





// A View provides a window to a table, using two Ranges to
// restrict which rows and columns will be visible.
function makeTableView(inTable, rowRange, inColumns) {
    var m_table = inTable
    var m_rowRange = rowRange || Range(0, m_table.rowCount())
    var m_columnIndexses = inColumns || range(0, m_table.fieldCount())  // array of ordered column indexes into the table columns [2, 1, ...]
    var m_columnIds = columnAttributes("id")                        // array of ordered column ids ["Bar", "Foo", ..]

    function range(begin, end) {
        var array = []
        for (var i = begin; i < end; ++i) {
            array.push(i)
        }
        return array;
    }

    function table() {
        return m_table
    }

    function columnIds() {
        return m_columnIds;
    }

    function columnIndexes() {
        return m_columnIndexses;
    }

    function columns() {
        return m_columnIndexses.map(function(index) { return m_table.field(index) })
    }

    function columnAttributes(attribute) {
        return m_columnIndexses.map(function(index) { return m_table.field(index)[attribute] })
    }

    function lookupColumn(id) {
        return m_columnIndexses.filter(function(index) { return m_table.field(index).id == id })[0]
    }

    function column(index) {
        return m_table.field(index)
    }

    function dimensionIndexes() {
        return m_columnIndexses
            .filter(function(index) { return m_table.field(index).kind == "dimension" })
    }

    function dimensionIds() {
        return columns()
            .filter(function(column) { return column.kind == "dimension" })
            .map(function(column) { return column.id })
    }

    function measureIndexes() {
        return m_columnIndexses
            .filter(function(index) { return m_table.field(index).kind == "measure" })
    }

    function measureIds() {
        return columns()
            .filter(function(column) { return column.kind == "measure" })
            .map(function(column) { return column.id })
    }

    function makeRow(index) {
        var row = {}
        m_columnIds.forEach(function(columnId) {
            row[columnId] = m_table.cell(index, columnId)
        })
        return row
    }

    function foreach(functor) {
        m_rowRange.forEach(function(index) {
            if (index >= m_table.rowCount()) {
                console.log("forEachRow: table index " + index +" out of bounds")
                return
            }
            functor(index)
        })
    }

    function forEachSubView(column, func) {
        var seenValues = {}
        foreach (function(rowIndex) {
            var key = m_table.cell(rowIndex, column)
            if (!(key in seenValues)) {
                seenValues[key] = true
                var makeView = function() {
                    var subRange = m_rowRange.filtered(function(subRowIndex){
                        return (m_table.cell(subRowIndex, column) == key)
                    })
                    return makeTableView(m_table, subRange, m_columnIndexses)
                }
                func(key, makeView)
            }
        })
    }

    function visitCells(columns, leafVisitor, internalVisitor) {
        if (columns.length == 0) {
            leafVisitor(this, [])
            return
        }
        visitCellsHelper(this, columns, 0, [], leafVisitor, internalVisitor)
    }

    function visitCellsHelper(view, columns, columnIndex, columnValues, leafVisitor, interiorVisitor) {
        view.forEachSubView(columns[columnIndex], function(key, makeview) {
            var dimensionValues = columnValues.slice(0)
            dimensionValues.push(key)
            var subView = makeview()
            var subColumnIndex = columnIndex + 1
            var subColumns = columns.slice(0, subColumnIndex)

            if (subColumnIndex >= columns.length) {
                if (leafVisitor)
                    leafVisitor(subView, subColumns, dimensionValues)
            } else {
                visitCellsHelper(subView, columns, subColumnIndex, dimensionValues, leafVisitor, interiorVisitor)
                if (interiorVisitor)
                    interiorVisitor(subView, subColumns, dimensionValues)
            }
        })
    }

    function subViews(column) {
        var subViews = {}
        forEachSubView(column, function(key, makeView){
            subViews[key] = makeView()
        })
        return subViews
    }

    function uniqueValues(column) {
        var values = []
        forEachSubView(column, function(value){
            values.push(value)
        })
        return values
    }

    function values(column) {
        var values = []
        foreach (function(row) {
            values.push(m_table.cell(row, column))
        })
        return values
    }

    function rowCount() {
        var count = 0
        foreach(function(row) {
            ++count
        })
        return count
    }

    return {
       "table" : table,
       "row" : makeRow,
       "columns" : columns,
       "columnIds" : columnIds,
       "columnIndexes" : columnIndexes,
       "columnAttributes" : columnAttributes,
       "lookupColumn" : lookupColumn,
       "column" : column,
       "dimensionIndexes" : dimensionIndexes,
       "dimensionIds" : dimensionIds,
       "measureIndexes" : measureIndexes,
       "measureIds" : measureIds,
       "foreach" : foreach,
       forEachSubView : forEachSubView,
       visitCells : visitCells,
       values : values,
       uniqueValues : uniqueValues,
       subViews : subViews,
       rowCount : rowCount,
    }
}