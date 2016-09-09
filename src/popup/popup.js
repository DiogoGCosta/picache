/**
 * Created by Diogo on 24/07/2016.
 */
function main(){
    var enabledText = "Picache is enabled<br>in this website";
    var disabledText = "Picache is disabled<br>in this website";
    var activeWebsite = null;
    var activeUrl = null;

    function enable(){
        $('#togglebutton').removeClass('inactive');
        $('#togglebutton').addClass('active');
        $('#togglebutton').html(enabledText);
    }

    function disable(){
        $('#togglebutton').removeClass('active');
        $('#togglebutton').addClass('inactive');
        $('#togglebutton').html(disabledText);
    }

    function getWebsite(callback){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            var website = tabs[0].url.split('/')[2];
            callback(website, tabs[0].url);
        });
    }

    getWebsite(function(website, url){
        activeWebsite = website;
        activeUrl = url;
        if(url.indexOf('http') == 0) {
            $('#button-place').append($('<div/>', {'id': 'togglebutton', 'class': 'active'}));

            chrome.runtime.sendMessage({method: 'getDisabledWebsites'}, function (response) {
                if (response.disabledWebsites.indexOf(website) >= 0) {
                    disable();
                } else {
                    enable();
                }
            });
        }else{
            $('#button-place').append($('<div/>', {'id': 'notelegible'}).text('Picache does not save images in this page'));
        }
    });
    $(document).ready(function(){
        enable();
        $('#togglebutton').click(function() {
            if ($(this).hasClass('active')) {
                disable();
                chrome.runtime.sendMessage({method: 'toggleWebsite', website: activeWebsite});
            } else {
                enable();
                chrome.runtime.sendMessage({method: 'toggleWebsite', website: activeWebsite});
            }
        });
    });
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    console.log(tabs[0].incognito);
    if(tabs[0].incognito) {
        chrome.storage.sync.get({saveIncognito:false}, function(items){
            console.log(items.saveIncognito);
            if(items.saveIncognito){
                main();
            }else{
                console.log("not tracking");
                $('#button-place').append($('<div/>', {'id': 'nottracking'}).text('Picache does not run in incognito browsing. You can activate that option in the settings'));
            }
        });
    }else {
        main();
    }
});
