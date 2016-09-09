/**
 * Created by Diogo on 18/07/2016.
 */
function main(){
    var last_time = Date.now();
    var searching = false;
    var searched = [];
    var queue = [];
    var website;
    var searchInfoInterval = null;

    function getClosestNext(element, debug) {
        if (element.length == 0) {
            return '';
        }
        var next = element;
        while (1) {
            if (next.length == 0) {
                break;
            }
            var temp = next.text();
            if (temp.length > 1) {
                return temp;
            } else {

            }
            next = next.next();
        }
        return getClosestNext(element.parent(), debug);
    }

    function getClosestPrev(element) {
        if (element.length == 0) {
            return '';
        }
        var prev = element;
        while (1) {
            if (prev.length == 0) {
                break;
            }
            var temp = prev.text();
            if (temp.length > 1) {
                return temp;
            } else {

            }
            prev = prev.prev();
        }
        return getClosestNext(element.parent());
    }

    function findHref(element) {
        var a = element.closest("a");
        if (a.length == 0) {
            a = '';
        } else {
            a = a.attr('href');
            if (a == '#') {
                a = '';
            }
        }

        return a;
    }

    var target = document;

    searchImages = function () {
        if (searching) {
            return;
        }
        searching = true;
        if (Date.now() > last_time + 2000) {
            $(document).find("img[picached!='true']").each(function (i) {
                $(this).attr('picached', 'true');
                queue.push({nodeName: 'img', element: $(this), time: Date.now()});
            });

            $(document).find("span[picached!='true']").each(function (i) {
                $(this).attr('picached', 'true');
                if ($(this).css('background-image') != 'none' && $(this).css('background-image').indexOf('linear-gradient') != 0) {
                    queue.push({nodeName: 'span', element: $(this), time: Date.now()});
                }
            });

            $(document).find("div[picache!='true']").each(function (i) {
                $(this).attr('picached', 'true');
                if ($(this).css('background-image') != 'none' && $(this).css('background-image').indexOf('linear-gradient') != 0) {
                    queue.push({nodeName: 'div', element: $(this), time: Date.now()});
                }
            });

            $(document).find("a[picache!='true']").each(function (i) {
                $(this).attr('picached', 'true');
                if ($(this).css('background-image') != 'none' && $(this).css('background-image').indexOf('linear-gradient') != 0) {
                    queue.push({nodeName: 'a', element: $(this), time: Date.now()});
                }
            });
            last_time = Date.now();
        }
        searching = false;
    };

    imageInfoSearch = function () {
        var images = [];
        while (queue.length > 0) {

            var node = queue.pop();
            var element = node.element;
            var t, url;
            var nodeName = node.nodeName;

            if (nodeName == 'img') {
                url = $(element).attr('src');
            } else {
                url = $(element).css('background-image').replace('url("', '').replace('")', '');
            }

            if (url.indexOf('data') == 0) {
                continue;
            }


            if (searched.indexOf(url) >= 0) {
                continue;
            }
            searched.push(url);
            var temp = new Image();
            temp.src = url;

            if (url.indexOf('//') == 0) {
                url = 'http:' + url;
            }
            t = '';
            if (nodeName == 'img')
                t += $(element).attr('alt');

            t += ' ' + getClosestNext($(element).parent(), true);
            t += ' ' + getClosestPrev($(element).parent());
            images.push({
                url: url,
                width: null,
                height: null,
                date: Date.now(),
                h: location.hostname,
                t: t,
                a: findHref($(element))
            });
            break;
        }
        chrome.runtime.sendMessage({method: "images", images: images});
    };

    $(document).ready(function () {
        website = window.location.hostname;
        chrome.runtime.sendMessage({method: "getDisabledWebsites"}, function (response) {
            /*
             console.log(website);
             console.log(response.disabledWebsites);
             */
            if (response.disabledWebsites.indexOf(website) == -1) {
                searchInfoInterval = setInterval(imageInfoSearch, 25);
                $(document).bind("DOMSubtreeModified", searchImages);
            }
        });
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.method == 'enableScript') {
                    if (searchInfoInterval == null) {
                        searchInfoInterval = setInterval(imageInfoSearch, 25);
                        $(document).bind("DOMSubtreeModified", searchImages);
                    }

                } else if (request.method == 'disableScript') {
                    clearInterval(searchInfoInterval);
                    $(document).unbind("DOMSubtreeModified");
                    searchInfoInterval = null;
                }
            }
        );

    });
}

if(chrome.extension.inIncognitoContext){
    chrome.storage.sync.get({saveIncognito:false}, function(items){
        console.log(items.saveIncognito);
        if(items.saveIncognito){
            main();
        }
    });
}else {
    main();
}