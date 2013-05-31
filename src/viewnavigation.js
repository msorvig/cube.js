
function dimensionIds(view) {
    return view.columns2()
        .filter(function(column) { return column.kind == "dimension" })
        .map(function(dimension) {return dimension.id})
        .join(" ")
}

function measureIds(view) {
    return view.columns2()
        .filter(function(column) { return column.kind == "measure" })
        .map(function(measure) {return measure.id})
        .join(" ")
}


function makeViewNavigation(view) {
var m_view = view

    function select(query) {
        return makeCube(m_view).select(query)
    }

    function forEachSubView(columnId, func) {
        var seenValues = {}
        m_view.foreach (function(row) {
            var key = row[columnId]
            if (!(key in seenValues)) {
                seenValues[key] = true
                var makeView = function(){
                    return select(columnId + " == '" + key + "'")
                }
                func(key, makeView)
            }
        })
    }

    function subViews(columnId) {
        var subViews = {}
        forEachSubView(columnId, function(key, makeView){
            subViews[key] = makeView()
        })
        return subViews
    }

    function uniqueValues(columnId) {
        var values = []
        forEachSubView(columnId, function(value){
            values.push(value)
        })
        return values
    }
    return {
        uniqueValues : uniqueValues,
        subViews : subViews,
        select : select,
    }

}
