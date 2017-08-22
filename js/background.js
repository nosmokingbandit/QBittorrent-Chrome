/*

This script runs in the background during startup.

Reads user config and cookie for qbit webui connection.

If user does not have cookie, logs in and stores cookie.

Starts an interval loop to get torrent status from qbit.

*/

var update_loop;
localStorage.logged_in = 0;


/* Set up context menu */
chrome.contextMenus.create({
    "title": "Download with QBittorrent",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});


/* Read user config */
var defaults = {"username": "username",
                "password": "password",
                "address": "http://localhost:8080",
                "display_notifications": false,
                "notification_duration": 10,
                "refresh_rate": 5
                }

for (var key in defaults){
    if(localStorage[key] === undefined){
        localStorage[key] = defaults[key];
    }
}

get_cookie();

if(localStorage.refresh_rate > 0){
    update_loop = setInterval(update, localStorage.refresh_rate * 1000);
}

/* Restart loop when user sets config */
function onStorageChange(event) {
    if (event.key == "refresh_rate") {
        clearInterval(update_loop);
        if(localStorage.refresh_rate > 0){
            update_loop = setInterval(update, localStorage.refresh_rate * 1000);
        }
    } else if (event.key == "address") {
        localStorage.logged_in = false;
    }
}

if (window.addEventListener)
    window.addEventListener("storage", onStorageChange, false);
else
    window.attachEvent("onstorage", onStorageChange);

// reset torrents on page creation
localStorage.setItem("torrents", JSON.stringify({}));
update();
