function Repl(env) {

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
        return text.map(function(textLine){ return evn.createTextNode(textLine) })
    }

    var m_cube = {}
    var m_view = {}

    function load(filePath) {
        var result = []
        function loadComplete(data) {
            m_cube = makeCube(makeTableView(makeTable(data)))
            result.push(env.createTextNode("Load OK: "+ filePath))
            result = result.concat(select(""))
        }
        function error(code) {
            result.push(env.createTextNode(filePath + ": " + code ))
        }

        syncGetJson(filePath, loadComplete, error)
        return result
    }

    function select(query) {
        m_view = m_cube.select(query)
        return [
            env.createTextNode("Columns " + m_view.columnIds().join(" ")),
            env.createTextNode("Rows " + m_view.rowCount()),
        ]
    }

    function print(query, view) {
        return env.styleTable(createList(cubeSelect(view, query)))
    }

    function tabulate(query, view) {
        return env.styleTable(createTable(cubeSelect(view, query)))
    }

    function plot(query, view) {
        return createHighChart(cubeSelect(view, query))
    }

    function foreach(query, view) {
        var parts = query.split(" ")
        var repeatDimension = parts[0]
        var repeatCommand = parts.slice(1).join(" ")

        return createViewRepater(view, repeatDimension,
            function(subView) {
                return switchCommand(repeatCommand, subView)
            }
        )
    }

    function selector(query, view) {
        var parts = query.split(" ")
        var selectDimension = parts[0]
        var selectCommand = parts.slice(1).join(" ")

        return createViewSelector(view, selectDimension,
            function(subView) {
                var foo = function () {
                    return switchCommand(selectCommand, subView)
                }
                return foo()
            }
        )
    }

    function switchCommand(commandLine, view) {
        if (commandLine.indexOf("help") == 0) {
            return printHelp()
        } else if (commandLine.indexOf("'help'") == 0) {
            return env.createTextNode("Try help (without the quotes)")
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
            return env.createTextNode("Unknown command: " + commandLine)
        }
    }

    function processCommand(commandLine) {
        env.setInputPlaceholderText("") // remove help message after first input

        historyIndex = -1 // reset history navigation
        if (commandLine.length > 0)
            pushHistory(commandLine)

        typedPrefix = "" // reset tab completion

        env.appendNode(env.createTextNode("> " + commandLine))
        var output = switchCommand(commandLine, m_view)
        if (output instanceof Array) {
            output.forEach(function(item) {
                env.appendNode(item)
            })
        } else {
            env.appendNode(output)
        }
        env.appendNode(env.createTextNode(" "))
    }

    function textChanged() {
        var value = env.getInputText()
        env.setInputText("")
        processCommand(value)
    }

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

    var tabCompleteIndex = -1
    var typedPrefix = ""
    function tabCompleteCommand() {
        if (typedPrefix == "")
            typedPrefix = env.getInputText()
        if (typedPrefix == "")
            return

        var candidates = commands.filter(function(command) {
            return command.indexOf(typedPrefix) == 0
        })
        if (candidates.length == 0)
            return

        ++tabCompleteIndex;
        var candidateIndex = tabCompleteIndex % candidates.length
        var candidate = candidates[candidateIndex]
        if (takesArgs[candidate])
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
