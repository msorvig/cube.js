function Range() {
    if (arguments.length < 1)
        console.log("ERROR: Range expects one argument")
    if (arguments[0] === undefined)
        return undefined

    var m_range = []

    if (arguments.length == 1) {
        m_range = arguments[0]
    } else if (arguments.length == 2) {
        m_range = [[arguments[0], arguments[1]]]
    }

    function isEmpty() {
        return m_range.length == 0 || (m_range[0][0] == 0 && m_range[0][1] == 0)
    }

    function contains(testpos, testlen) {
        if (testlen === undefined)
            testlen = 1
        // check if the test range is contained in a single sub-range (assumes merged sub-ranges)
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]
            if (pos <= testpos && testpos + testlen <= pos + len)
                return true
        }
        return false
    }

    function forEach(functor) {
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]
            for (var j = pos; j < pos + len; ++j) {
                functor(j)
            }
        }
    }

    function map(functor) {
        var array = []
        forEach (function(index) {
            array.push(functor(index))
        })
        return array
    }

    function filter(prediacte) {
        var array = []
        forEach (function(index) {
            if (prediacte(index))
                array.push(index)
        })
        return array
    }

    function filtered(prediacte) {
        var builder = RangeBuilder()
        forEach (function(index) {
            if (prediacte(index))
                builder.add(index, 1)
        })
        return builder.range()
    }

    function toString() {
        return m_range.toString()
    }

    return  {
        "isEmpty" : isEmpty,
        "contains" : contains,
        "forEach" : forEach,
        "map" : map,
        "filter" : filter,
        "filtered" : filtered,
        "toString" : toString,
    }
}

function RangeBuilder() {
    if (arguments.length > 2)
        console.log("ERROR: makeRange expects at most 2 arguments")

    var initPos = arguments[0] || 0
    var initLen = arguments[1] || 0
    var m_range = [[initPos, initLen]] // array of [pos, len]

    function _mergeRange(index) {
        //console.log("merge " + index + " " + m_range.length)

        var lenincrement = 0
        var pos = m_range[index][0]
        var len = m_range[index][1]

        for (var i = index + 1; i < m_range.length; ++i) {
            var mergepos = m_range[i][0]
            var mergelen = m_range[i][1]

            //console.log("mergepos " + mergepos + " mergelen" + mergelen)

            if (mergepos > pos + len) 
                break;

            //console.log("range++ " +  ((mergepos + mergelen) - (pos + len)))

            if (mergepos + mergelen >= pos + len)
                m_range[index][1] += ((mergepos + mergelen) - (pos + len))

            m_range.splice(i, 1)
            --i;
        }
    }

    function add(newpos, newlen) {
        // find the insertion point
        for (var i = 0; i < m_range.length; ++i) {
            var pos = m_range[i][0]
            var len = m_range[i][1]

            // skip sub-ranges before the current range
            if (pos + len < newpos)
                continue

            // extend the current sub-range if there is an overlap
            //console.log(pos + " " + newpos + " " + (pos + len))
            if (pos <= newpos && newpos <= pos + len) {
                // extend with the non-overlapping part of the new range
                m_range[i][1] += Math.max(0, newlen - (pos + len - newpos))
                //console.log(m_range[i][0])
                //console.log(m_range[i][1])

                _mergeRange(i)
                return
            }

            // check if the new range is before the current sub-range
            if (newpos < pos)
                break
        }
        // no existing sub-range found, insert/append new range
        m_range.splice(i, 1, [newpos, newlen])
        _mergeRange(i)
    }

    function range() {
        return Range(m_range)
    }

    return  {
        "add" : add,
        "range" : range,
    }
}

