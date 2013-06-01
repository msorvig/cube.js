
// A View provides a window to a table, using two Ranges to
// restrict which rows and columns will be visible.
function makeTableView(inTable, rowRange, columnRange) {
    var m_table = inTable
    var m_rowRange = rowRange || makeRange(0, m_table.rowCount())
    var m_columnRange = columnRange || makeRange(0, m_table.fieldCount())
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

    return {
       "table" : table,
       "columns" : columnIds,
       "columns2" : columns,
       "columnAttributes" : columnAttributes,
       "lookupColumn" : lookupColumn,
       "foreach" : foreach,
    }
}