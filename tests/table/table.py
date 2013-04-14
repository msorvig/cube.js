import json
import itertools

def create2DTableSchema(dimensionNames, measureNames):
    fields = []
    for dimensionName in dimensionNames:
        descriptor = { "id" : dimensionName, "label" : dimensionName, "kind" : "dimension" }
        fields.append(descriptor);
    for measureName in measureNames:
        descriptor = { "id" : measureName, "label" : measureName, "kind" : "measure" }
        fields.append(descriptor);
    return { "fields" : fields }

def create2DTableData(dimensionNames, measureNames, size):
    table = []
    dimentionCount = len(dimensionNames)
    
    for rowDimentionIndexes in itertools.product(range(size), repeat = dimentionCount):
        row = {}
        for index, val in enumerate(rowDimentionIndexes):
            row[dimensionNames[index]] = dimensionNames[index] + str(val)
            for measureIndex, measureName in enumerate(measureNames):
                row[measureName] = 10 * (measureIndex + 1) * val # generate arbitary measure values
        table.append(row)
    return table

dimensions = ["DimensionA", "DimensionB"]
measures = ["Measure1", "Measure2"]
root = { "schema" : create2DTableSchema(dimensions, measures), 
         "rows"  : create2DTableData(dimensions, measures, 10), 
        }

json = json.dumps(root);
f = open('data.json', 'w')
#print json
f.write(json)




    
    