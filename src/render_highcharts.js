
function makeHighchartsRenderer(view) {

    var m_viewNavigation = makeViewNavigation(view)

    var m_dimensions = dimensionIds(view)
    if (m_dimensions.length < 1) {
        console.log("HighchartsRenderer needs two dimentions")
    }
    // Categories are the (unique) values of the first dimention
    var categoriesDimension = m_dimensions[0];
    var m_categories = m_viewNavigation.uniqueValues(categoriesDimension)

    // Series are the (unique) values in of second dimention
    var seriesDimension = m_dimensions[1];
    var m_series = m_viewNavigation.uniqueValues(seriesDimension)

    var m_measures = measureIds(view)
    var m_measure = m_measures[0];

    //console.log(dimensionIds(view))
    //console.log(m_categories)
    //console.log(m_series)

    function title() {
        return m_measure
    }

    function categories() {
        return m_categories;
    }

    function serie(view) {
        return makeViewNavigation(view).values(m_measure)
    }

    function series() {

        var s = []
        m_viewNavigation.forEachSubView(seriesDimension, function(key, makeview) {
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

