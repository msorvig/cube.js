
// A View provides a window to a table, using two Ranges to
// restrict which rows and columns will be visible.
function makeTableView(inTable, rowRange, columnRange) {
    var m_table = inTable
    var m_rowRange = rowRange || Range(0, m_table.rowCount())
    var m_columnRange = columnRange || Range(0, m_table.fieldCount())
    var m_columnIds = columnIds()

    function table() {
        return m_table
    }

    function columnIds() {
        return columnAttributes("id")
    }

    function columns() {
        return m_columnRange.map(function(index) { return m_table.field(index) })
    }

    function columnAttributes(attribute) {
        return m_columnRange.map(function(index) { return m_table.field(index)[attribute] })
    }

    function lookupColumn(id) {
        return m_columnRange.filter(function(index) { return m_table.field(index).id == id })[0]
    }

    function dimensionIds() {
        return columns()
            .filter(function(column) { return column.kind == "dimension" })
            .map(function(dimension) {return dimension.id})
    }

    function measureIds() {
        return columns()
            .filter(function(column) { return column.kind == "measure" })
            .map(function(measure) {return measure.id})
    }

    function foreach(functor) {
        m_rowRange.forEach(function(index) {
            if (index >= m_table.rowCount()) {
                console.log("forEachRow: table index " + index +" out of bounds")
                return
            }
            //console.log("cell " + m_table.row(index))
            // select columns
            var row = {}
            //columnRange.foreach(function(index) {
            //    row[m_table.fieldIds()[index]] = m_table.cell(index, ),
            //})

            m_columnIds.forEach(function(columnId){
                row[columnId] = m_table.cell(index, columnId)
            })
            
            functor(row, index)
        })
    }

    function forEachSubView(columnId, func) {
        var seenValues = {}
        foreach (function(row) {
            var key = row[columnId]
            if (!(key in seenValues)) {
                seenValues[key] = true
                var makeView = function() {
                    var subRange = m_rowRange.filtered(function(rowIndex){
                        return (m_table.cell(rowIndex, columnId) == key)
                    })
                    return makeTableView(m_table, subRange, m_columnRange)
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

    function values(columnId) {
        var values = []
        foreach (function(row) {
            var value = row[columnId]
            values.push(value)
        })
        return values
    }

    function rowCount() {
        var count = 0
        foreach(function(row) {
            ++count
        })
        return count
    }

    return {
       "table" : table,
       "columns" : columnIds,
       "columns2" : columns,
       "columnAttributes" : columnAttributes,
       "lookupColumn" : lookupColumn,
       "dimensionIds" : dimensionIds,
       "measureIds" : measureIds,
       "foreach" : foreach,
       forEachSubView : forEachSubView,
       values : values,
       uniqueValues : uniqueValues,
       subViews : subViews,
       rowCount : rowCount,
    }
}