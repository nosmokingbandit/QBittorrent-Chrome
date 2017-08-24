var body;

$(document).ready(function(){
    body = $("body");
    update_interface();
});

var toolbar = `
<ul id="toolbar">
    <li>
        <a class="button-32 pause-all"></a>
        Pause All
    </li>
    <li>
        <a class="button-32 resume-all"></a>
        Resume All
    </li>
</ul>`;

function footer(speeds){
    return `
    <div id="footer">
        ${speeds[0]}
        ${speeds[1]}
    </div>
    `

}

function update_interface(){
    chrome.storage.local.get(["torrent_html", "speed_totals", "logged_in", "address"], function(config){
        if(!config.logged_in){
            var html = `
            <div id="error">
                <h3>Unable to connect to QBittorrent</h3>
                <p>Unable to connect to QBittorrent server at ${config.address}.</p>
                <p>
                    <a href="${chrome.extension.getURL('../html/options.html')}" target="_blank">
                        Reveiew your settings.
                    </a>
                </p>
            </div>`;
            body.html(html);
        } else {
            html = toolbar;
            html += `<div id="torrents">`;
            html += config.torrent_html;
            html += `</div>`;
            html += footer(config.speed_totals);
            body.html(html);
        }
    })
};

/* Update interface when storage.local.torrent_html updates */
window.addEventListener("storage", function(event){
    if(event.torrent_html){
        update_interface();
    }
}, false);

document.addEventListener("click", function(e){
    if(!e.target){
        return
    } else if(e.target.dataset.action == "remove"){
        remove_torrent(e.target);
    } else if(e.target.dataset.action == "toggle_status"){
        toggle_status(e.target);
    }
});

function toggle_status(elem){
    /* Changes torrent status between paused/active
    elem (obj): button element
    */
    var torrent = elem.closest('.torrent');

    var hash = torrent.dataset.hash;

    if(torrent.dataset.paused == "true"){
        api_command("/command/resume", {"hash": hash});
    } else {
        api_command("/command/pause", {"hash": hash});
    }
}


function remove_torrent(elem){
    /* Removes torrent from QBit
    elem (obj): button element

    */
    var hash = elem.closest('.torrent').dataset.hash;
}
