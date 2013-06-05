
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

function createHighChart(view) {
    var dataProvider = HighchartsDataProvider(view)
    var target = $("<div>")
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
    return target
}


