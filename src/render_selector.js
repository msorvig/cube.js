
function createViewRepater(view, dimension, callback) {
	var container = $("<div>")
	view.forEachSubView(dimension, function(val, makeView) {
		container.append(callback(makeView(), val))
	})
	return container
}

function createViewSelector(view, dimension, callback) {
	var values = []
	var viewMakers = { }
	view.forEachSubView(dimension, function(value, makeView) {
		values.push(value)
		viewMakers[value] = makeView
	})

	var container = $("<div>")
	var selector = createSelector(values)

	function onSelectionChanged(selection) {
		var newDiv = $("<div>")
		newDiv.append(selector.render())
		newDiv.append(callback(viewMakers[selection](), selection))
		container.empty()
		container.append(newDiv)
	}
	selector.setCallback(onSelectionChanged)

	return container
}

function createSelector (values, selected) {
	var m_selected = selected || values[0]
	var m_values = values
	var m_onChangeCallback
	
	function changeSelection(selected) {
		m_selected = selected
		if (m_onChangeCallback !== undefined)
			m_onChangeCallback(selected)
	}
	
	function setCallback(onChangeCallback) {
		m_onChangeCallback = onChangeCallback
		changeSelection(m_selected)
	}
	
	function render() {
		var page = $("<div class='pagination'>")
		var ul = $("<ul>")
		page.append(ul)
		
		values.forEach(function(value) {
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
	
	return  { 
		setCallback : setCallback,
		render : render,
	}
}