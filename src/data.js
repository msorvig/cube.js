
function getJson_impl(url, callback, error, async) {
    var request = new XMLHttpRequest();
    request.onload = function(e) {
        if (request.status == 200) {
            callback(JSON.parse(request.responseText))
        } else {
            console.log("getJson: Error opening " + url + " Status: " + request.status)
            if (error != undefined) {
                error(request.status)
            }
        }
    };
    request.open("get", url, async);
    request.send();
}

function getJson(url, callback, error) {
    getJson_impl(url, callback, error, true)
}

function syncGetJson(url, callback, error) {
    getJson_impl(url, callback, error, false)
}

function syncGet(url) {
    var obj
    syncGetJson(url, function(data) {
        obj = data
    })
    return obj
}


function loadData(dataUrl, callback)
{
    getJson(dataUrl + '/data.json' , callback)
}

