// view->html "table-list" (1D table)
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

