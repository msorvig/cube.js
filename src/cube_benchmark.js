// Runs benchmark "name" with {options}
// 
// Known options are:
// setup : a setup function (optional)
// fn : the function to benchmakr
// maxTime : max benchmark runtime (seconds)
//
function benchmark(name, options) {
    var benchmarkObject = new Benchmark(
        name, 
        options.fn,
        {
            "setup" : options.setup,
            "onStart" :function() { console.log("begin benchmark " + name) },
            "onComplete": function(event) { console.log(String(event.target)) },
            "maxTime" : options.maxTime || 0.5,
        }
    )

    benchmarkObject.run()
}

function makeTestTable()
{
    var ids = ["Foo", "Bar", "Baz"]
    var table = makeTable(ids)
    var rows = [ { Foo: 1, Bar : "A", Baz : 3.14 },
                 { Foo: 2, Bar : "B", Baz : 2.71 },
                 { Foo: 3, Bar : "C", Baz : 6.62 } ]

    for (var i = 0; i < 10; ++i) {
        rows.forEach(function(row) { 
            table.addRow(row)
        })
    }
    return table
}

benchmark("cube.parse", {
    "setup" : function() { 
        var table = makeTestTable()
        var tableView = makeTableView(table)
        var cube = makeCube(tableView)
    },
    "fn" : function() {
        selectView = cube.select("Foo > 1 Baz > 5") 
    },
})

