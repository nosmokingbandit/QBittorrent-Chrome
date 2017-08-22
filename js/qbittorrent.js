/* Contains all methods used to interact with QBit server */

function get_cookie(){
    /* Gets auth cookie from Qbittorrent WebUI
    */

    $.post(localStorage.address + "/login", {
        "username": encodeURIComponent(localStorage.username),
        "password": encodeURIComponent(localStorage.password)
    })
    .done(function(response){
        if(response == "Fails."){
            console.log("Unauthorized")
        } else {
            localStorage.logged_in = true;
        }
    })
    .fail(function(data){
        var err = data.status
        console.log(err);
    })
}

function get_torrents(){
    /* Gets torrents status from Qbit server

    Stores torrents as localStorage.torrents

    Response from server is a list of objects.
    [{
        "size": 1609039872,
        "num_leechs": 2,
        "upspeed": 0,
        "eta": 432,
        "category": "",
        "added_on": 1503348878,
        "completion_on": 4294967295,
        "ratio": 0,
        "dlspeed": 3294914,
        "num_complete": 53,
        "seq_dl": false,
        "name": "ubuntu-17.04-desktop-amd64.iso",
        "save_path": "C:\\Users\\Name\\Downloads\\",
        "num_seeds": 42,
        "f_l_piece_prio": false,
        "progress": 0.11828150600194931,
        "super_seeding": false,
        "hash": "59066769b9ad42da2e508611c33d7c4480b3857b",
        "num_incomplete": 4,
        "state": "downloading",
        "force_start": false,
        "priority": 2
    },
    {
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
    */

    $.get(localStorage.address + "/query/torrents")
    .done(function(response){
        console.log(response)
        localStorage.torrents = response;
    })
    .fail(function(data){
        var err = data.status
        console.log(err);
        localStorage.logged_in = false;
    })
}

function update(){
    /* Executed by update_loop to get info from QBit.
    */
    if(localStorage.logged_in === "false"){
        get_cookie();
    }
    get_torrents()
};