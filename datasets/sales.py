import json
import itertools
import random

countries = ["Germany", "France", "Italy"]
cities = { "Germany" : ["Berlin", "Dusseldorf", "Munic"], "France" : ["Paris", "Lyon", "Marseille"], "Italy" : ["Rome", "Milan", "Naples"] }
products = ["A", "B", "C", "D"]
years = [2010, 2011, 2012, 2013]

dimensions = ["Country", "City", "Product", "Year"]
measures = ["Sales"]

def createTableSchema(dimensionNames, measureNames):
    fields = []
    for dimensionName in dimensionNames:
        descriptor = { "id" : dimensionName, "label" : dimensionName, "kind" : "dimension" }
        fields.append(descriptor);
    for measureName in measureNames:
        descriptor = { "id" : measureName, "label" : measureName, "kind" : "measure" }
        fields.append(descriptor);
    return { "fields" : fields }

rows = []
for country in countries:
    for city in cities[country]:
        for product in products:
            for year in years:
                value = round(random.random() * 100)
                row = { "Country" : country, "City" : city, "Product" : product, "Year" : year, "Sales" : value }
                rows.append(row)
                
root = { "schema" : createTableSchema(dimensions, measures), 
         "rows"  : rows }
         
json = json.dumps(root);
f = open('sales.json', 'w')
f.write(json)
