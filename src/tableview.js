
// A View provides a window to a table, using two Ranges to
// restrict which rows and columns will be visible.
function makeTableView(inTable, rowRange, inColumns) {
    var m_table = inTable
    var m_rowRange = rowRange || Range(0, m_table.rowCount())
    var m_columnIndexses = inColumns || range(0, m_table.fieldCount())  // array of ordered column indexes into the table columns [2, 1, ...]
    var m_columnIds = columnAttributes("id")                        // array of ordered column ids ["Bar", "Foo", ..]

    function range(begin, end) {
        var array = []
        for (var i = begin; i < end; ++i) {
            array.push(i)
        }
        return array;
    }

    function table() {
        return m_table
    }

    function columnIds() {
        return m_columnIds;
    }

    function columnIndexes() {
        return m_columnIndexses;
    }

    function columns() {
        return m_columnIndexses.map(function(index) { return m_table.field(index) })
    }

    function columnAttributes(attribute) {
        return m_columnIndexses.map(function(index) { return m_table.field(index)[attribute] })
    }

    function lookupColumn(id) {
        return m_columnIndexses.filter(function(index) { return m_table.field(index).id == id })[0]
    }

    function column(index) {
        return m_table.field(index)
    }

    function dimensionIndexes() {
        return m_columnIndexses
            .filter(function(index) { return m_table.field(index).kind == "dimension" })
    }

    function dimensionIds() {
        return columns()
            .filter(function(column) { return column.kind == "dimension" })
            .map(function(column) { return column.id })
    }

    function measureIndexes() {
        return m_columnIndexses
            .filter(function(index) { return m_table.field(index).kind == "measure" })
    }

    function measureIds() {
        return columns()
            .filter(function(column) { return column.kind == "measure" })
            .map(function(column) { return column.id })
    }

    function makeRow(index) {
        var row = {}
        m_columnIds.forEach(function(columnId) {
            row[columnId] = m_table.cell(index, columnId)
        })
        return row
    }

    function foreach(functor) {
        m_rowRange.forEach(function(index) {
            if (index >= m_table.rowCount()) {
                console.log("forEachRow: table index " + index +" out of bounds")
                return
            }
            functor(index)
        })
    }

    function forEachSubView(column, func) {
        var seenValues = {}
        foreach (function(rowIndex) {
            var key = m_table.cell(rowIndex, column)
            if (!(key in seenValues)) {
                seenValues[key] = true
                var makeView = function() {
                    var subRange = m_rowRange.filtered(function(subRowIndex){
                        return (m_table.cell(subRowIndex, column) == key)
                    })
                    return makeTableView(m_table, subRange, m_columnIndexses)
                }
                func(key, makeView)
            }
        })
    }

    function visitCells(columns, leafVisitor, internalVisitor) {
        if (columns.length == 0) {
            leafVisitor(this, [])
            return
        }
        visitCellsHelper(this, columns, 0, [], leafVisitor, internalVisitor)
    }

    function visitCellsHelper(view, columns, columnIndex, columnValues, leafVisitor, interiorVisitor) {
        view.forEachSubView(columns[columnIndex], function(key, makeview) {
            var dimensionValues = columnValues.slice(0)
            dimensionValues.push(key)
            var subView = makeview()
            var subColumnIndex = columnIndex + 1
            var subColumns = columns.slice(0, subColumnIndex)

            if (subColumnIndex >= columns.length) {
                if (leafVisitor)
                    leafVisitor(subView, subColumns, dimensionValues)
            } else {
                visitCellsHelper(subView, columns, subColumnIndex, dimensionValues, leafVisitor, interiorVisitor)
                if (interiorVisitor)
                    interiorVisitor(subView, subColumns, dimensionValues)
            }
        })
    }

    function subViews(column) {
        var subViews = {}
        forEachSubView(column, function(key, makeView){
            subViews[key] = makeView()
        })
        return subViews
    }

    function uniqueValues(column) {
        var values = []
        forEachSubView(column, function(value){
            values.push(value)
        })
        return values
    }

    function values(column) {
        var values = []
        foreach (function(row) {
            values.push(m_table.cell(row, column))
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
       "row" : makeRow,
       "columns" : columns,
       "columnIds" : columnIds,
       "columnIndexes" : columnIndexes,
       "columnAttributes" : columnAttributes,
       "lookupColumn" : lookupColumn,
       "column" : column,
       "dimensionIndexes" : dimensionIndexes,
       "dimensionIds" : dimensionIds,
       "measureIndexes" : measureIndexes,
       "measureIds" : measureIds,
       "foreach" : foreach,
       forEachSubView : forEachSubView,
       visitCells : visitCells,
       values : values,
       uniqueValues : uniqueValues,
       subViews : subViews,
       rowCount : rowCount,
    }
}