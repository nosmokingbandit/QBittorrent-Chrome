var body;

$(document).ready(function(){
    body = $("body");
    update_interface();
});

var toolbar = `
<div id="toolbar">
    <div class="logo">
        <img src="../img/icon-48.png"/>
    </div>
    <div class="button green" data-action="resume_all">
        <i class="icon ion-play" data-action="resume_all"></i>
        Resume All
    </div>
    <div class="button orange" data-action="pause_all">
        <i class="icon ion-pause" data-action="pause_all"></i>
        Pause All
    </div>
</div>`;



function update_interface(){
    chrome.storage.local.get(["torrent_html", "stats", "logged_in", "address"], function(config){
        if(!config.logged_in){
            var error_html = `
            <div id="error">
                <h3>Unable to connect to QBittorrent</h3>
                <p>Unable to connect to QBittorrent server at ${config.address}.</p>
                <p>
                    <a href="${chrome.extension.getURL('../html/options.html')}" target="_blank">
                        Reveiew your settings.
                    </a>
                </p>
            </div>`;
            body.html(error_html);
        } else {
            html = toolbar;
            html += `<div id="torrents">`;
            html += config.torrent_html;
            html += `</div>`;
            html += `<div id="footer">
                        ${config.stats.torrent_count} Torrents
                        <span class="speed_totals">
                            <i class="icon ion-arrow-up-b"></i>
                            ${config.stats.upload_speed}/s
                            <i class="icon ion-arrow-down-b"></i>
                            ${config.stats.download_speed}/s
                        </span>

                     </div>`;
            body.html(html);
        }
    })
};

/* Update interface when storage.local.torrent_html updates */
chrome.storage.onChanged.addListener(function(changes, namespace){
    if(changes.torrent_html){
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
    } else if(e.target.dataset.action == "pause_all"){
        pause_all(e.target);
    } else if(e.target.dataset.action == "resume_all"){
        resume_all(e.target);
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

    api_command("/command/deletePerm", {"hashes": hash});
}

function pause_all(elem){
    api_command("/command/pauseAll");
}

function resume_all(elem){
    api_command("/command/resumeAll");
}