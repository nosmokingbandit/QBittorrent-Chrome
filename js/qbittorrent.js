background = chrome.extension.getBackgroundPage();

/* Contains all methods used to interact with QBit server and generate data for interface */

function update(){
    /* Executed by update_loop to get info from QBit.
    */
    chrome.storage.local.get("logged_in", function(config){
        if(!config.logged_in){
            login();
        } else {
            get_torrent_info();
        }
    })
};

function login(){
    /* Gets auth cookie from Qbittorrent WebUI
    */
    chrome.storage.local.get(["address", "username", "password"], function(config){
        $.post(config.address + "/login", {
            "username": encodeURIComponent(config.username),
            "password": encodeURIComponent(config.password)
        })
        .done(function(response){
            if(response == "Fails."){
                background.apply_badge(["ERR"])
                chrome.browserAction.setIcon({path: "../img/icon-16-disabled.png"});
                chrome.browserAction.setBadgeBackgroundColor({"color": "#FF5722"});
            } else {
                /* Only success condition */
                chrome.storage.local.set({"logged_in": true});
                chrome.browserAction.setIcon({path: "../img/icon-16.png"});
                chrome.browserAction.setBadgeBackgroundColor({"color": "#43A047"});
                get_torrent_info();
            }
        })
        .fail(function(data){
            var err = data.status
            background.apply_badge(["ERR"])
            chrome.storage.local.set({"logged_in": false});
            chrome.browserAction.setIcon({path: "../img/icon-16-disabled.png"});
            chrome.browserAction.setBadgeBackgroundColor({"color": "#FF5722"});
        })
    })
};

function get_torrent_info(){
    /* Gets torrents status from Qbit server
    Response from server is a list of objects.
    [{
        "size": 1513308160,
        "num_leechs": 0,
        "upspeed": 0,
        "eta": 8640000,
        "category": "",
        "added_on": 1503348871,
        "completion_on": 4294967295,
        "ratio": 0,
        "dlspeed": 0,
        "num_complete": 84,
        "seq_dl": false,
        "name": "ubuntu-16.04.1-desktop-amd64.iso",
        "save_path": "C:\\Users\\Name\\Downloads\\",
        "num_seeds": 0,
        "f_l_piece_prio": false,
        "progress": 0.007459535729140043,
        "super_seeding": false,
        "hash": "9f9165d9a281a9b8e782cd5176bbcc8256fd1871",
        "num_incomplete": 4,
        "state": "pausedDL",
        "force_start": false,
        "priority": 1
    }]

    Returns list of objects
    */

    chrome.storage.local.get(["address", "display_notifications"], function(config){
        console.log(config.display_notifications)
        $.get(config.address + "/query/torrents?sort=priority")
        .done(function(response){

            if(config.display_notifications && background.last_response !== null){
                background.notify(response, background.last_response);
            }

            background.last_response = response;
            parse_torrents(response);
        })
        .fail(function(response){
            var err = response.status;
            chrome.storage.local.set({"logged_in": false});
            parse_torrents([])
        })
    })
};

function parse_torrents(torrents){
    /* Parses QBit response
    torrents (array): objects of torrent data

    Sets storage.torrent_html, storage.stats, and storage.badge_counts
    Applies badge

    Does not return
    */

    var downloading_count = 0;
    var seeding_count = 0;
    var total_up = 0;
    var total_down = 0;
    var html = "";

    for(var index in torrents){
        var torrent = torrents[index];

        var progress = parseInt(torrent.progress * 100)

        html += render_torrent(torrent);

        if(["downloading", "stalledDL", "metaDL"].indexOf(torrent.state) > -1){
            downloading_count += 1;
        } else if(["uploading", "stalledUP"].indexOf(torrent.state) > -1){
            seeding_count += 1;
        }

        total_up += torrent.upspeed;
        total_down += torrent.dlspeed;
    }
    chrome.storage.local.set({"stats": {"upload_speed": file_size(total_up).join(""),
                                        "download_speed": file_size(total_down).join(""),
                                        "torrent_count": torrents.length
                                        },
                              "torrent_html": html,
                              "badge_counts": [downloading_count, seeding_count]
    });
    background.apply_badge([downloading_count, seeding_count]);
}

function render_torrent(torrent){
    /* Renders torrent html for list
    torrent (obj): torrent info from QBit server

    Returns str
    */

    var [size, suffix] = file_size(torrent.size);
    var state;
    if(["pausedUP", "pausedDL", "queuedUP"].indexOf(torrent.state) > -1){
        state = "paused";
    } else if(["error", "missingFiles"].indexOf(torrent.state) > -1){
        state = "error";
    } else if(["stalledUP", "stalledDL"].indexOf(torrent.state) > -1){
        state = "stalled";
    } else {
        state = "active";
    };

    var complete_percent = parseInt(torrent.progress * 100) + "%";

    var row = `
    <div class="torrent" data-hash="${torrent.hash}" data-paused="${state == 'paused' ? 'true' : 'false'}">
        <b>${torrent.name}</b>
        <div class="progress_container">
            <div class="progress">
                <div class="bar ${state}" style="width: ${state == "error" ? "100%" : complete_percent}"></div>
            </div>
            <span class="controls">
                <i class="icon ${state == 'paused' ? 'ion-play' : 'ion-pause'} action" data-action="toggle_status"></i>
                <i class="icon ion-close action" data-action="remove"></i>
            </span>
        </div>

        <div class="stats">
            <span class="size">
                ${(size * torrent.progress).toFixed(1) + " / " + size + suffix + " (" + complete_percent + ")"}
            </span>
            <span class="eta">
                ${format_eta(torrent.eta)}
            </span>

            <span class="speeds">
                <i class="icon ion-arrow-up-b"></i>
                ${file_size(torrent.upspeed).join("") + "/s"}
                <i class="icon ion-arrow-down-b"></i>
                ${file_size(torrent.dlspeed).join("") + "/s"}
            </span>
        </div>
    </div>
    `
    return row
};

function file_size(b) {
    var u = 0, s=1024;
    while (b >= s || -b >= s) {
        b /= s;
        u++;
    }
    return [(u ? b.toFixed(1) : b), ' KMGTPEZY'[u] + 'B'];
}

function api_command(path, params){
    /* Sends api request to QBit
    path (str): sub-path to api call (ie "/command/resume")
    params (obj): params to send in POST    <optional>

    Sends api command and updates interface.

    Returns str response from
    */

    chrome.storage.local.get("address", function(config){
        $.post(config.address + path, params)
        .always(function(response){
            update();
        })
    })
}

function format_eta(s){
    /* Creates human-readable eta format
    s (int): seconds to eta

    Returns string
    */

    if(s == 8640000){
        return "";
    }

    var days = ~~(s / 86400);
    var hours = ~~((s % 86400) / 3600);
    var minutes = ~~(((s % 86400) % 3600) / 60);
    var seconds = ((s % 86400) % 3600) % 60;

    h = [];
    days > 0 ? h.push(days + " Days") : "";
    hours > 0 ? h.push(hours + " Hours") : "";
    minutes > 0 ? h.push(minutes + " Minutes") : "";
    seconds > 0 ? h.push(seconds + " Seconds") : "";
    return h.join(", ");
}

/* Ugly hack to get requests working with newer QBittorrent versions
Sets request headers 'Origin' and 'Referrer' to 'http://localhost:8080' before sending
*/

handler = function(details) {
    var isRefererSet = false;
    var headers = details.requestHeaders,
        blockingResponse = {};

    if(!headers.Referer){
        headers.push({name: "Referer", value: "http://localhost:8080"});
        headers.push({name: "Origin", value: "http://localhost:8080"});
    }
    blockingResponse.requestHeaders = headers;
    return blockingResponse;
};

chrome.webRequest.onBeforeSendHeaders.addListener(handler, {urls: ["<all_urls>"]}, ['requestHeaders', 'blocking']);
