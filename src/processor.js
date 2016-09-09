/**
 * Created by Diogo on 18/07/2016.
 */
var cached_images = [];
var ready = false;
var waiting_images = 0;
var ignoreWidth = 0, ignoreHeight = 0;
var disabledWebsites;

var newImages = 0;

function loadSettings(){
    chrome.storage.sync.get({
        ignoreWidth: 65,
        ignoreHeight: 65,
        disabledWebsites: [],
    }, function(items) {
        ignoreWidth = items.ignoreWidth;
        ignoreHeight = items.ignoreHeight;
        disabledWebsites = items.disabledWebsites;
    });
}

function saveSettings(){
    chrome.storage.sync.set({
        ignoreWidth: ignoreWidth,
        ignoreHeight: ignoreHeight,
        disabledWebsites: disabledWebsites
    });
}
loadSettings();

function uniq_fast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = a[i];
        if(typeof seen[item.url] === 'undefined') {
            seen[item.url] = item;
            seen[item.url].index = j;
            out[j++] = item;
        }else{
            if(item.date > seen[item.url].date){
                out[seen[item.url].index].date = item.date;
                seen[item.url].date = item.date;
            }
        }
    }
    /*console.log(out);*/
    return out;
}
chrome.storage.local.get('images', function(obj){
    if(typeof obj.images === 'undefined' || obj.images == ''){
        cached_images = []
    }else {
        cached_images = obj.images;
        //cached_images = JSON.parse(obj.images);
        //cached_images =  LZString.decompress(cached_images);
    }
    if(typeof cached_images === 'undefined'){
        cached_images = [];
    }
    ready = true;
});

function decrementWaitingImages(){
    waiting_images--;
    newImages++;
    if(waiting_images <= 0){
        waiting_images = 0;
    }
}

function getImageDimentions(image, callback){
    function findHHandWW() {
        callback(this.width, this.height);
        return true;
    }

    function error(e){
        console.log("chrome-extension image");
        decrementWaitingImages();
    }
    var myImage = new Image();
    myImage.name = 'random';
    myImage.onload = findHHandWW;
    myImage.onerror = error;
    myImage.src = image.url;
}

function saveImage(image){
    if(typeof image.url === 'undefined'){
        decrementWaitingImages();
        return;
    }
    if(image.url.indexOf('chrome-extension') == -1) {
        getImageDimentions(image, function (w, h) {
            if(w >= ignoreWidth && h >= ignoreHeight){
                image.width = w;
                image.height = h;
                image.t = image.t.toLowerCase();
                //prepare key words
                image.t = image.t.replace(/[.,:;\+\-*><\[\]{}!"#$%|$%&/()0-9“']/gi, ' ').split(/\s+/).join(' ');
                image.t=image.t.split(' ').filter(function(item,i,allItems){
                    return i==allItems.indexOf(item);
                }).join(' ').substr(0,256);
                cached_images.push(image);
                cached_images = uniq_fast(cached_images);
            }
            decrementWaitingImages();
        });
    }

}

function sendToWebsite(website, method){
    chrome.tabs.query({}, function(tabs){
        for(var i = 0; i < tabs.length; i++){
            console.log(tabs[i].url.split('/')[2] + ' == ' + website);
            if(tabs[i].url.split('/')[2] == website){
                chrome.tabs.sendMessage(tabs[i].id, {method: method});
            }
        }
    });
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var i;
        if(request.method == 'images'){
            if(ready){
                waiting_images += request.images.length;

                for(i = 0; i < request.images.length; i++){
                    saveImage(request.images[i])
                }
            }
        }
        if(request.method == 'getimages'){
            sendResponse({images: cached_images});
        }
        if(request.method == 'deleteimages'){
            var temp = [];
            if(request.deleteWidth > 0){
                for(i = 0; i < cached_images.length; i++){
                    if(cached_images[i].width >= request.deleteWidth){
                        temp.push(cached_images[i]);
                    }
                }
                cached_images = temp;
            }else if(request.deletedHeight > 0){
                for(i = 0; i < cached_images.length; i++){
                    if(cached_images[i].height >= request.deleteHeight){
                        temp.push(cached_images[i]);
                    }
                }
                cached_images = temp;
            }
        }

        if(request.method == 'deleteImagesFiltered'){
            var minWidth = request.minWidth;
            var maxWidth = request.maxWidth;
            var minHeight = request.minHeight;
            var maxHeight = request.maxHeight;
            var minTime = request.minTime;
            var maxTime = request.maxTime;
            var searchTerm = request.searchTerm;
            var hostnameFilter = request.hostnameFilter;
            temp = [];
            var count = 0;
            console.log(minWidth + ' ' + maxWidth + ' ' + minHeight + ' ' + maxHeight + ' ' + minTime + ' ' + maxTime + ' ' + searchTerm + ' ' + hostnameFilter);
            for(i = 0; i < cached_images.length; i++){
                if(cached_images[i].width >= minWidth && (maxWidth == 4096 || cached_images[i].width <= maxWidth) && cached_images[i].height >= minHeight && (maxHeight == 4096 || cached_images[i].height <= maxHeight)
                    && cached_images[i].date <= maxTime && cached_images[i].date >= minTime && (hostnameFilter == '' || hostnameFilter == cached_images[i].h)
                    && (searchTerm == '' || cached_images[i].t.indexOf(searchTerm)>= 0)) {
                    count++;
                }else{
                    temp.push(cached_images[i])
                }
            }
            console.log(count + " images deleted")
            cached_images = temp;
            sendResponse({method:'imagesDeleted'});


            newImages++;

        }

        if(request.method == 'deleteImageByUrl'){
            var url = request.url;
            for( i = 0; i < cached_images.length; i++){
                if( cached_images[i].url == url){
                    cached_images.splice(i, 1);
                    break;
                }
            }
        }

        if(request.method == 'updatesettings'){
            ignoreWidth = request.ignoreWidth;
            ignoreHeight = request.ignoreHeight;
            disabledWebsites = request.disabledWebsites;
            chrome.tabs.query({}, function(tabs){
                for(var i = 0; i < tabs.length; i++){
                    if(disabledWebsites.indexOf(tabs[i].url.split('/')[2])==-1){
                        chrome.tabs.sendMessage(tabs[i].id, {method: 'enableScript'});
                    }else{
                        chrome.tabs.sendMessage(tabs[i].id, {method: 'disableScript'});
                    }
                }
            });
        }

        if(request.method == 'getDisabledWebsites'){
            sendResponse({disabledWebsites: disabledWebsites});
        }

        if(request.method == 'toggleWebsite'){
            var website = request.website;
            if(disabledWebsites.indexOf(website) == -1){
                disabledWebsites.push(website);
                sendToWebsite(website, 'disableScript');
                //chrome.runtime.sendMessage({method:'disableScript', website:website});
                saveSettings();
            }else{
                disabledWebsites.splice(disabledWebsites.indexOf(website),1);
                sendToWebsite(website, 'enableScript');
                saveSettings();
            }
        }

    });

openImagesTab = function(){
    chrome.tabs.create({url: 'images.html'});
};

var suspending;
saveCachedImages = function(){
    var temp = cached_images;
    //var saving = true;
    if(suspending)
        return;
    suspending = true;
    console.log("Exiting and saving...")
    chrome.storage.local.set({'images': temp},function(){
        //saving = false;

    });
    /*
    var i = 0;
    while(saving){
        i++;
        console.log(i)
    }
    */
};

setInterval(function(){
    if(newImages > 0 && waiting_images == 0){
        var temp = cached_images;
        chrome.storage.local.set({'images': temp});
        console.log("Images saved.");
        newImages = 0;
    }
},2000);


chrome.browserAction.onClicked.addListener(openImagesTab);
chrome.runtime.onSuspend.addListener(saveCachedImages);