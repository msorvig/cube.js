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

// Constructor 1 : makeTable(ids, labels, kinds)
// Constructor 2: function makeTabe(tableData)
// ### factor 1 into tableBuilder?
function makeTable(ids, labels, kinds) {
    var table = {}
    if (ids.schema !== undefined && ids.rows !== undefined) {
        // hackety -- a table JSON data structure was passed. Use it.
        table = ids
    } else {
        table = {
            "schema" : { "fields" : makeFields(ids, labels, kinds) },
            "rows" : []
        }
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

    function field(index) {
        return table.schema.fields[index];
    }

    function fieldAttribute(index, attribute) {
        table.schema.fields[index][attribute]
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

    function indexOfField(fieldId) {
        return table.schema.fields.forEach(function(field, index){
            if (field.id == fieldId)
                return index;
        })
        return -1
    }

    function cell(row, field) {
        return table.rows[row][field]
    }

    return {
        "addRow" : addRow,
        "rowCount" : rowCount,
        "row" : row,
        "field" : field,
        "fieldCount" : fieldCount,
        "fieldIds" : fieldIds,
        "fieldLabels" : fieldLabels,
        "fieldKinds" : fieldKinds,
        "filterFields" : filterFields,
        "cell" : cell
    }
}




