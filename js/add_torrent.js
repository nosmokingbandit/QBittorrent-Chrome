var torrent_url;
var html = "";

$(document).ready(function(){
    var url = new URL(window.location.href);
    var get_params = new URLSearchParams(url.search);
    torrent_url = decodeURIComponent(get_params.get("t"));
    cat_select = $("#categories_select");

    $("div#download").click(send);
    $("div#cancel").click(function(){
        window.close();
    });

    chrome.storage.local.get("categories", function(config){
        var cats = config.categories;

        cats.forEach(function(cat){
            html += `
            <option value="${cat.name}">
                ${cat.name + " [" + cat.directory + "]"}
            </option>`
        });

        cat_select.append(html);
    });
});

function send(){

    var params = {urls: torrent_url}
    var category = cat_select.val();

    if(category){
        params["category"] = category;
        chrome.storage.local.get("categories", function(config){
            var directory = config.categories.find(x => x.name === category).directory;

            if(directory){
                params["savepath"] = directory;
            }
        });
    };

    api_command("/command/download", params);
    window.close();
}