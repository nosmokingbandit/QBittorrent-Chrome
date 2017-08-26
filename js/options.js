var $inputs;

$(document).ready(function() {
    $inputs = $("form input");
    $categories = $("table#categories tbody")

    document.getElementById("save_settings").onclick = save_settings;
    document.getElementById("cancel_save").onclick = cancel_save;
    document.getElementById("add_category").onclick = add_category;

    document.getElementById("categories").addEventListener("click", function(e){
        if(!e.target){
            return
        } else if(e.target.dataset.action == "remove_category"){
            remove_category(e.target);
        }
    });
    load_config();
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
        settings.categories.forEach(function(category){
            var row = `
            <tr>
                <td>
                    <input type="text" class="name" value="${category.name}"/>
                </td>
                <td>
                    <input type="text" class="directory" value="${category.directory}"/>
                </td>
                <td>
                    <i class="icon ion-close" data-action="remove_category"></i>
                </td>
            </tr>`
            $categories.append(row)
        });
    })
}

function add_category(){
    var row = `
    <tr>
        <td>
            <input type="text" class="name"/>
        </td>
        <td>
            <input type="text" class="directory"/>
        </td>
        <td>
            <i class="icon ion-close" data-action="remove_category"></i>
        </td>
    </tr>`

    $categories.append(row)
}

function remove_category(element){
    var row = element.closest("tr");
    row.parentNode.removeChild(row);

}

function cancel_save(){
    window.location.reload();
}


function save_settings(){
    /* Saves user's settings to storage.local
    */

    var settings = {};

    document.getElementById("server").querySelectorAll("input").forEach(function(input){
        settings[input.id] = input.value;
    });

    var categories = [];
    document.getElementById("categories").querySelectorAll("tbody > tr").forEach(function(row){
        var cat = {};
        Array.from(row.getElementsByTagName("input")).forEach(function(input){
            if(input.className == "name"){
                cat["name"] = input.value;
            } else if(input.className = "directory"){
                cat["directory"] = input.value;
            }
        });
        if(cat.name && cat.directory){
            categories.push(cat);
        }

    });

    settings["categories"] = categories;
    chrome.storage.local.set(settings);
}