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
                apply_badge(["ERR"])
            } else {
                chrome.storage.local.set({"logged_in": true});
                get_torrent_info();
            }
        })
        .fail(function(data){
            var err = data.status
            apply_badge(["ERR"])
            chrome.storage.local.set({"logged_in": false});
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

    chrome.storage.local.get("address", function(config){
        $.get(config.address + "/query/torrents?sort=priority")
        .done(function(response){
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

    Sets storage.torrent_html, storage.speed_totals, and storage.badge_counts
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
    chrome.storage.local.set({"speed_totals": [file_size(total_up).join(""), file_size(total_down).join("")],
                              "torrent_html": html,
                              "badge_counts": [downloading_count, seeding_count]
    });
    apply_badge([downloading_count, seeding_count]);
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
    } else if(["stalledUP", "stalledDL"]){
        state = "stalled";
    } else {
        state = "active";
    };

    var complete = parseInt(torrent.progress * 100) + "%";

    var row = `
    <div class="torrent" data-hash="${torrent.hash}" data-paused="${state == 'paused' ? 'true' : 'false'}">
        ${torrent.name}
        <div class="progress">
            <div class="bar ${state}" style="width: ${state == "error" ? "100%" : complete}"></div>
        </div>
        <div class="status">
            <span class="size">
                ${complete + "  " + (size * torrent.progress).toFixed(1) + " / " + size + suffix}

            </span>
            <span class="controls">
                <i class="typcn ${state == 'paused' ? 'typcn-media-play' : 'typcn-media-pause'} action" data-action="toggle_status"></i>
                <i class="typcn typcn-times action" data-action="remove"></i>
            </span>
            <span class="speeds">
                <i class="typcn typcn-arrow-up"></i>
                ${file_size(torrent.upspeed).join("") + "/s"}
                <i class="typcn typcn-arrow-down"></i>
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

function apply_badge(c){
    /* show badge with downloading/seeding counts
    c (array): counts of downloading torrents [downloading, seeding]
    */
    chrome.browserAction.setBadgeText({"text": c.join(":")})
}