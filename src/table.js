/*
    http://www.dataprotocols.org/en/latest/json-table-schema.html

    Table: {
        schema {
            fields [
                { "id" : , "label" : "kind" : }
            ]
        }
        rows [
        
        ]
    }
*/

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

function makeTable(ids, labels, kinds) {
    return {
        "schema" : {
            "fields" : makeFields(ids, labels, kinds)
        },
        "rows" : []
    }
}

function addRow(table, row) {
    table.rows.push(row)
}

function rowCount(table) {
    return table.rows.length
}

function row(table, index) {
    return table.rows[index]
}

function fieldAttributes(table, attribute) {
    return table.schema.fields.map(
        function(field){ return field[attribute] }
    )
}

function fieldIds(table) {
    return fieldAttributes(table, "id")
}

function fieldLabels(table) {
    return fieldAttributes(table, "label")
}

function fieldKinds(table) {
    return fieldAttributes(table, "kind")
}
function filterFields(table, fieldIds) {
    return table.schema.fields.filter(
        function(field) { return (fieldIds.indexOf(field) != -1) }
    )
}