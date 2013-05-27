
function makeTableView(table, rowRange, columnRange) {
    var m_table = table
    var m_rowRange = rowRange || makeRange(0, table.rowCount())
    var m_columnRange = columnRange || makeRange(0, table.fieldCount())
    var columnIds = m_columnRange.map(function(index) { return m_table.fieldIds()[index] })

    function columns() {
        
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

            columnIds.forEach(function(columnId){
                row[columnId] = m_table.cell(index, columnId)
            })
            
            functor(row, index)
        })
    }
    
    function rowCount() {
        
    }

    return {
       "columns" : columns,
       "foreach" : foreach,
       "rowCount" : rowCount,
    }
}