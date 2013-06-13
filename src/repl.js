function Repl(env) {
    var commands = ["help", "load", "select", "print", "tabulate", "plot"] // keep in sync with help text!
    var takesArgs= { "help" : false, "load" : true, "select" : true, "print" : true, "tabulate" : true, "plot" : true }
    function printHelp(){
        var text = [
            ["Available commands:" ],
            ["help        This help"],
            ["load        Load data set:         'load sales.json'"],
            ["select      Run query on data set: 'select Product City'"],
            ["print       Print data list:      'print'"],
            ["tabulate    Print data table:      'print'"],
            ["plot        Plot data graph:       'plot'"],
        ]
        text.forEach(function(textLine) { env.appendTextLine(textLine) })
    }

    var cube = {}
    var view = {}

    function load(filePath) {
        function loadComplete(data) {
            env.appendTextLine("Load OK: "+ filePath)
            cube = makeCube(makeTableView(makeTable(data)))
            select("")
        }
        function error(code) {
            env.appendTextLine(filePath + ": " + code )
        }

        syncGetJson(filePath, loadComplete, error)
    }

    function select(query) {
        view = cube.select(query)
        env.appendTextLine("Columns " + view.columnIds().join(" "))
        env.appendTextLine("Rows " + view.rowCount())
    }

    function print(query) {
        env.appendTable(createList(cubeSelect(view, query)))
    }

    function tabulate(query) {
        env.appendTable(createTable(cubeSelect(view, query)))
    }

    function plot(query) {
        env.appendNode(createHighChart(cubeSelect(view, query)))
    }

    function switchCommand(commandLine) {
        if (commandLine.indexOf("help") == 0) {
            printHelp()
        } else if (commandLine.indexOf("'help'") == 0) {
            env.appendTextLine("Try help (without the quotes)")
        } else if (commandLine.indexOf("load") == 0) {
            var filePath = commandLine.substring(5) // everything after "load "
            load(filePath)
        } else if (commandLine.indexOf("select") == 0) {
            var query = commandLine.substring(7)
            select(query)
        } else if (commandLine.indexOf("print") == 0) {
            var query = commandLine.substring(6)
            print(query)
        } else if (commandLine.indexOf("tabulate") == 0) {
            var query = commandLine.substring(9)
            tabulate(query)
        } else if (commandLine.indexOf("plot") == 0) {
            var query = commandLine.substring(5)
            plot(query)
        } else {
            env.appendTextLine("Unknown command: " + commandLine)
        }
    }

    function processCommand(commandLine) {
        env.setInputPlaceholderText("") // remove help message after first input

        historyIndex = -1 // reset history navigation
        pushHistory(commandLine)

        typedPrefix = "" // reset tab completion

        env.appendTextLine("> " + commandLine)
        switchCommand(commandLine)
        env.appendTextLine(" ")
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
