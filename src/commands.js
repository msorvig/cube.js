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
