var port = chrome.extension.connect({ name: "list" });

/*
    Collects the IDs of all torrents currently listed in the UI. IDs are stored
    as the name attribute of elements with the CSS .list-item class.

    Returns a list of IDs.
*/
function getIds() {
    var ids = [];

    $(".list-item").each(function () {
        ids.push(JSON.parse($(this).attr("name")));
    });

    return ids;
}

function size_to_str(size, units, unit_size) {
    var size_str = size.toFixed(0);
    var unit_str = "";

    for (var i = 0; i < units.length; i++) {
        if (size < unit_size) {
            unit_str = units[i];
            break;
        }
        else {
            size = size / unit_size;
            size_str = size.toFixed(2);
        }
    }

    return size_str + " " + unit_str;
}

$(document).ready(function(){
    update_interface();

});


function update_interface(event){
    if(localStorage.logged_in === "false"){
        var html = `
        <div class="alert alert-warning">
            <h4>Unable to connect to QBittorrent</h4>
            <p>Unable to connect to QBittorrent server at ${localStorage.address}.</p>
            <p>
                <a href='${chrome.extension.getURL("../html/options.html")}' class="alert-link" target="_blank">
                    Reveiew your settings.
                </a>
            </p>
        </div>`

    } else {
        html = "torrents: ";

        html += localStorage.torrents
    }

    $("body").html(html);
}

window.addEventListener("storage", update_interface, false);

