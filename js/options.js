var $inputs;

$(document).ready(function() {
    $inputs = $("form input");
    load_config();
    document.getElementById("save_settings").onclick = save_settings;

});

function load_config(){
    /* Loads localStorage config into html form
    */
    $inputs.each(function(i, element){
        if(element.type === "checkbox"){
            element.checked = localStorage[element.id];
        } else {
            element.value = localStorage[element.id] || "";
        }
    });
}

function save_settings(){
    /* Saves user's settings to localStorage
    */

    $inputs.each(function(i, element){
        if(element.type == "checkbox"){
            localStorage.setItem(element.id, element.checked || false)
        } else {
            localStorage.setItem(element.id, element.value)
        }
    });

}