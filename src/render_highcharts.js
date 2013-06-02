

function dimensionIds(view) {
    return view.columns2()
        .filter(function(column) { return column.kind == "dimension" })
        .map(function(dimension) {return dimension.id})
}

function measureIds(view) {
    return view.columns2()
        .filter(function(column) { return column.kind == "measure" })
        .map(function(measure) {return measure.id})
}

function HighchartsDataProvider(view) {
    var m_dimensions = dimensionIds(view)
    if (m_dimensions.length < 1) {
        console.log("HighchartsRenderer needs two dimentions")
    }
    // Categories are the (unique) values of the first dimention
    var categoriesDimension = m_dimensions[0];
    var m_categories = view.uniqueValues(categoriesDimension)

    // Series are the (unique) values in of second dimention
    var seriesDimension = m_dimensions[1];

    // Use the first measure by default
    var m_measures = measureIds(view)
    var m_measure = m_measures[0];

    function title() {
        return m_measure
    }

    function categories() {
        return m_categories;
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

    return {
        title : title,
        categories : categories,
        series : series,
    }
}

function makeHighChart(target, view) {
    var dataProvider = HighchartsDataProvider(view)

    target.highcharts({
        chart: {
            type: 'bar'
        },
        title: {
            text: dataProvider.title()
        },
        xAxis: {
            categories: dataProvider.categories(),
            title: {
                text: 'Test'
            }

        },
        yAxis: {
            title: {
                text: 'Test'
            }
        },
        series : dataProvider.series()
    });
}


