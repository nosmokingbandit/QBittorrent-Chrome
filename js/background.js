/*

This script runs in the background during startup.

Reads user config and cookie for qbit webui connection.

If user does not have cookie, logs in and stores cookie.

Starts an interval loop to get torrent status from qbit.

*/

var update_loop;

chrome.storage.local.set({"logged_in": false,
                          "torrent_html": "",
                          "speed_totals": ["",""],
                          "badge_counts": [0, 0]
})

/* Set up context menu */
chrome.contextMenus.create({
    "title": "Download with QBittorrent",
    "contexts": ["link"],
    "onclick": add_torrent
});

/* Show badge on icon */
chrome.browserAction.setBadgeBackgroundColor({"color": "#158cba"});

/* Read user config and set defaults */
var defaults = {"username": "username",
                "password": "password",
                "address": "http://localhost:8080",
                "display_notifications": false,
                "notification_duration": 10,
                "refresh_rate": 5
                };

chrome.storage.local.get(null, function(c_storage){
    for(var key in defaults){
        if(c_storage[key] === undefined){
            c_storage[key] = defaults[key];
        }
    }
    storage = c_storage;
    chrome.storage.local.set(c_storage);

    update_loop = setInterval(update, storage.refresh_rate * 1000);
});

/* When user changes config:
Set logged_in flag to false if address, usename, or password changed
Restart update loop
Update var storage
*/
chrome.storage.onChanged.addListener(function(changes, namespace){

    if(Object.keys(changes).some(c => ["address", "username", "password"].indexOf(c) > -1)){
        chrome.storage.local.set({"logged_in": false});
    }

    if(changes.refresh_rate){
        clearInterval(update_loop);
        if(changes.refresh_rate.newValue > 0){
            update_loop = setInterval(update, changes.refresh_rate.newValue * 1000);
        }
    }

    chrome.storage.local.get(null, function(c_storage){
        storage = c_storage;
    })
});

function add_torrent(){
    /* Sends torrent to QBit server
    TODO: this
    */
}


// Fire update immediately, skipping interval wait, and apply badge
update();