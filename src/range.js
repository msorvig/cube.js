
function makeRange() {
    var range = [] // array of [pos, len]

    function _mergeRange(index) {
        //console.log("merge " + index + " " + range.length)

        var lenincrement = 0
        var pos = range[index][0]
        var len = range[index][1]

        for (var i = index + 1; i < range.length; ++i) {
            var mergepos = range[i][0]
            var mergelen = range[i][1]

            //console.log("mergepos " + mergepos + " mergelen" + mergelen)

            if (mergepos > pos + len) 
                break;

            //console.log("range++ " +  ((mergepos + mergelen) - (pos + len)))

            if (mergepos + mergelen >= pos + len)
                range[index][1] += ((mergepos + mergelen) - (pos + len))

            range.splice(i, 1)
            --i;
        }
    }

    function isEmpty() {
        return range.length == 0
    }

    function add(newpos, newlen) {
        // find the insertion point
        for (var i = 0; i < range.length; ++i) {
            var pos = range[i][0]
            var len = range[i][1]

            // skip sub-ranges before the current range
            if (pos + len < newpos)
                continue

            // extend the current sub-range if there is an overlap
            //console.log(pos + " " + newpos + " " + (pos + len))
            if (pos <= newpos && newpos <= pos + len) {
                // extend with the non-overlapping part of the new range
                range[i][1] += Math.max(0, newlen - (pos + len - newpos))
                //console.log(range[i][0])
                //console.log(range[i][1])

                _mergeRange(i)
                return
            }

            // check if the new range is before the current sub-range
            if (newpos < pos)
                break
        }
        // no existing sub-range found, insert/append new range
        range.splice(i, 1, [newpos, newlen])
        _mergeRange(i)
    }

    function contains(testpos, testlen) {
        if (testlen === undefined)
            testlen = 1
        // check if the test range is contained in a single sub-range (assumes merged sub-ranges)
        for (var i = 0; i < range.length; ++i) {
            var pos = range[i][0]
            var len = range[i][1]
            if (pos <= testpos && testpos + testlen <= pos + len)
                return true
        }
        return false
    }

    function foreach(functor) {
        for (var i = 0; i < range.length; ++i) {
            var pos = range[i][0]
            var len = range[i][1]
            for (var j = pos; j < pos + len; ++j) {
                functor(i + j)
            }
        }
    }

    return  {
        "isEmpty" : isEmpty,
        "add" : add,
        "contains" : contains,
        "foreach" : foreach,
    }
}

