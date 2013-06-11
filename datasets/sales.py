import json
import itertools
import random

# reproducable randomness
random.seed(0)

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
                # Create some imaginary factors:
                # Ever increasing sales (yay)
                salesIncrease = (year - years[0]) * 0.3 + 1
                # Product B was never really popular
                dontLikeB = 0.5 if (product == "B") else 1
                # Product C sells better
                likeC = 1.5 if (product == "C") else 1
                # The Berliners like to shop
                berlin = 2 if (city == "Berlin") else 1
                # The Italians are frugal
                italy = 0.8 if (country == "Italy") else 1
				# The inhabitants of lyon really have a thing for product A
                lyonLoveA = 2 if (city == "Lyon" and product == "A") else 1
				# In early 2012 Munic got a really bad batch of D and sales plumeted
                municHorribleD = 0.2 if (year == 2012 and city == "Munic" and product == "D") else 1

                value = round(salesIncrease * dontLikeB * likeC * berlin * italy * lyonLoveA * municHorribleD * random.random() * 100)
                row = { "Country" : country, "City" : city, "Product" : product, "Year" : year, "Sales" : value }
                rows.append(row)
                
root = { "schema" : createTableSchema(dimensions, measures), 
         "rows"  : rows }
         
json = json.dumps(root);
f = open('sales.json', 'w')
f.write(json)
