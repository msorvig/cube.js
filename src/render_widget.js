/*
    Widgets render table views.

    Widget Interface:
    Constructor: 
        var foo = createFoo(view, ...)
    Get html/dom nodes:
        foo.render()
    Update view:
        foo.update(view)

    (the widget updates its internal DOM on update() - render is not called again)    
*/

// 
function createHtmlWidget(html) {
    function render() { return html }
    function update(view) { } // no-op
    return { render: render, update: update }
}

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

// embeds
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

function createSubViewRepater(view, dimension, callback) {
    var container = $("<div>")
    view.forEachSubView(dimension, function(val, makeView) {
        container.append(callback(makeView(), val))
    })
    return container
}

function createSubViewWidget(view, dimension, createCallback, createTextCallback) {
    var widgets = {}
    function render() {
        var container = $("<div>")
        view.forEachSubView(dimension, function(val, makeView) {
            var widget = createCallback(makeView())
            widgets[val] = widget
            if (createTextCallback)
                container.append(createTextCallback(val))
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



    
    