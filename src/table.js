/*
    http://www.dataprotocols.org/en/latest/json-table-schema.html

    Table: {
        schema {
            fields [
                { "id" : , "label" : "kind" : }
            ]
        }
        rows [
            { "fieldId" : value }
        ]
    }
*/


function makeTable(ids, labels, kinds) {
    var table = {
        "schema" : { "fields" : makeFields(ids, labels, kinds) },
        "rows" : []
    }

    function makeFields(ids, labels, kinds) {
        var definedIds = ids // id is mandatory
        var definedLabels = labels || [] // optional
        var definedkinds = kinds || [] // optional
        var fields = []

        for (var i = 0; i < definedIds.length; ++i) {
            fields.push({ "id" : definedIds[i],
                          "label" : definedLabels[i],
                          "kind" : definedkinds[i] })
        }
        return fields
    }

    function addRow(row) {
        table.rows.push(row)
    }

    function rowCount() {
        return table.rows.length
    }

    function row(index) {
        return table.rows[index]
    }

    function fieldCount() {
        return table.schema.fields.length
    }

    function fieldAttributes(attribute) {
        return table.schema.fields.map(
            function(field){ return field[attribute] }
        )
    }

    function fieldIds() {
        return fieldAttributes("id")
    }

    function fieldLabels() {
        return fieldAttributes("label")
    }

    function fieldKinds() {
        return fieldAttributes("kind")
    }

    function filterFields(fieldIds) {
        return table.schema.fields.filter(
            function(field) { return (fieldIds.indexOf(field) != -1) }
        )
    }

    function cell(row, field) {
        return table.rows[row][field]
    }

    return {
        "addRow" : addRow,
        "rowCount" : rowCount,
        "row" : row,
        "fieldCount" : fieldCount,
        "fieldIds" : fieldIds,
        "fieldLabels" : fieldLabels,
        "fieldKinds" : fieldKinds,
        "filterFields" : filterFields,
        "cell" : cell
    }
}




