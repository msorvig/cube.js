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




    
    