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
}