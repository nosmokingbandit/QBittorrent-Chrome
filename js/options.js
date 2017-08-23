var $inputs;

$(document).ready(function() {
    $inputs = $("form input");
    load_config();
    document.getElementById("save_settings").onclick = save_settings;

});

function load_config(){
    /* Loads storage.local config into html form
    */
    chrome.storage.local.get(null, function(settings){
        $inputs.each(function(i, element){
            if(element.type === "checkbox"){
                element.checked = settings[element.id];
            } else {
                element.value = settings[element.id] || "";
            }
        });
    })
}

function save_settings(){
    /* Saves user's settings to storage.local
    */

    var settings = {};
    $inputs.each(function(i, element){
        if(element.type == "checkbox"){
            settings[element.id] = element.checked || false;
        } else {
            settings[element.id] = element.value;
        }
    });

    chrome.storage.local.set(settings);
}