var N_IMG = 75;

var nextIndex = 0;
var images = [];

/*filters*/
var minWidth = 0, maxWidth = 4096;
var minHeight = 0, maxHeight = 4096;
var minTime = 0, maxTime = 1;
var searchTerm = '';
var hostnameFilter = '';

var imagesDiv = '';
var requestupdateTimer = null;

var hostnames = [];


var hiding = false;
var scrollingUp = false;



function pad(n) { return ("0" + n).slice(-2); }

function nextImages(){

    var rendered = 0;
    var count = 0;
    if(nextIndex == -1){
        return;
    }
    $('#loader').show();
    setTimeout(function(){
        $('#loader').hide();
    },500);
    for(var i = nextIndex; rendered < N_IMG && i>=0; i--){
        /*console.log(images[i].width);*/
        if(images[i].width >= minWidth && (maxWidth == 4096 || images[i].width <= maxWidth) && images[i].height >= minHeight && (maxHeight == 4096 || images[i].height <= maxHeight)
        && images[i].date <= maxTime && images[i].date >= minTime && (hostnameFilter == '' || hostnameFilter == images[i].h)
        && (searchTerm == '' || images[i].t.indexOf(searchTerm)>= 0)){
            var hosticon = '';

            var img = $('<div/>', {'class': 'image', 'imgid': i});

            if(typeof images[i].h !== 'undefined'){
                //img.append($('<img/>', {'class':'hosticon', 'src' : favIcons[images[i].h]}));
                img.append($('<img/>', {'class':'hosticon', 'src' : 'http://www.google.com/s2/favicons?domain=' + images[i].h}));
            }
            (function(i, img, obj, deleteImage){
                img.append($('<img/>', {'class':'deleteicon', 'src' : 'img/delete1.ico'}).click(function(){
                    chrome.runtime.sendMessage({method: 'deleteImageByUrl', url:obj.url});
                    deleteImage(obj, i);
                }));
            })(i, img, images[i], function(obj, i){
                images.splice(images.indexOf(obj),1);
                $('div[imgid='+i+']').fadeOut(500);
            });

            if(typeof images[i].a !== 'undefined' && images[i].a != ''){
                var href = images[i].a;
                if( href.indexOf('/')==0 ){
                    href = 'http://' + images[i].h + href;
                }
                var gotoLink = $('<a/>', {'href': href, 'target': '_blank', 'alt': 'ola'}).append($('<img/>', {'class':'gotolink', 'src' : 'img/goto.png'}));
                //gotoLink.append($('<span/>', {'class': 'tooltiptext'}).text(href));
                img.append(gotoLink);
            }

            img.append($('<div/>', {'class': 'time'}).html(filterDate(images[i].date) + '<br/>' + images[i].width + 'x' + images[i].height));
            img.append($('<a/>', {'href': images[i].url, 'data-featherlight': 'image'}).append(($('<div/>', {'class': 'imagediv'})).append($('<img/>', {'class': 'img', 'src': images[i].url}))));
            $('#images').append(img);
            rendered++;
        }
        count++;
    }


    nextIndex -= count;
    if(nextIndex < 0){
        nextIndex = -1;
        $('#no-more').show();
    }else{
        $('#no-more').hide();
    }
}

function rangeInfo(selector, left, center, right){
    if(right == 4096){
        right = '∞';
    }
    $( selector ).empty();
    $( selector ).append($('<span/>', {'text': left, 'class': 'left-range'}));
    $( selector ).append($('<span/>', {'text': center, 'class': 'center-range'}));
    $( selector ).append($('<span/>', {'text': right, 'class': 'right-range'}));
}

function getImages(forceDraw){
    if(typeof forceDraw === 'undefined'){
        forceDraw = false;
    }
    chrome.runtime.sendMessage({method:'getimages'}, function(response){
        var temp = null;
        if(images.length > 1){
            temp = images[images.length-1].date;
        }

        images = response.images;
        console.log(images.length);
        images.sort(function(a, b){
            if (a.date > b.date) {
                return 1;
            }
            if (a.date < b.date) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        if(images.length == 0){
            $('#no-more').show();
            $('#loader').hide();
            console.log("what3");
            return;
        }

        minTime = images[0].date;
        maxTime = images[images.length-1].date;
        if(!forceDraw && temp != null && temp == maxTime){
            console.log("what1");
            return;
        }
        console.log("what2");
        $('#images').empty();
        $('#hostselect').empty();

        hostnames = [];
        $('#hostselect').append($('<option>', {value: '', text:'All websites'}));

        for(var i = 0; i < images.length; i++){
            if(typeof images[i].h !== 'undefined' && hostnames.indexOf(images[i].h) == -1){
                hostnames.push(images[i].h);
                $('#hostselect').append($('<option>', {value: images[i].h, text:images[i].h}));
            }
        }


        $('#no-more').hide();
        if(hostnameFilter != ''){
            $('#hostselect').val(hostnameFilter);
        }

        $( '#time-range' ).slider({
            range: true,
            min: minTime,
            max: maxTime,
            values: [ minTime, maxTime ],
            slide: function( event, ui ) {
                minTime = ui.values[ 0 ];
                maxTime = ui.values[ 1 ];

                rangeInfo('#time-range-text', filterDate(minTime), 'Time', filterDate(maxTime));

                if(requestupdateTimer != null){
                    clearTimeout(requestupdateTimer);
                }
                requestupdateTimer = setTimeout(
                    function() {
                        nextIndex = images.length - 1;
                        $('#images').empty();
                        nextImages();
                    }, 100
                );
            }
        });
        rangeInfo('#time-range-text', filterDate(minTime), 'Time', filterDate(maxTime));
        nextIndex = images.length - 1;
        console.log(nextIndex);
        nextImages();
    });
}

$(document).ready(function(){
    imagesDiv = document.getElementById("images");
    getImages();
    $('#refresh-images').click(function(){
        imagesDiv.innerHTML = '';
        getImages();
    });

    $('#width-selector').change(function(e){
        $('#width-filter').val($(this).val());
    });
    $('#width-selector').change(function(e){
        $('#width-filter').val($(this).val());
    });

    $('#searchbox').on('input', function(e){
        searchTerm = $(this).val().toLowerCase();
        requestupdateTimer = setTimeout(
            function() {
                nextIndex = images.length - 1;
                $('#images').empty();
                nextImages();
            }, 100
        );
    });

    $( "#width-range" ).slider({
        range: true,
        min: 0,
        max: 6400,
        values: [ 0, 6400 ],
        slide: function( event, ui ) {
            minWidth = Math.floor(Math.pow(ui.values[ 0 ]/100,2));
            maxWidth = Math.floor(Math.pow(ui.values[ 1 ]/100,2));
            rangeInfo('#width-range-text', minWidth, 'Width', maxWidth);

            if(requestupdateTimer != null){
                clearTimeout(requestupdateTimer);
            }
            requestupdateTimer = setTimeout(
                function() {
                    nextIndex = images.length - 1;
                    $('#images').empty();
                    nextImages();
                }, 100
            );
        }
    });

    $( '#height-range' ).slider({
        range: true,
        min: 0,
        max: 6400,
        values: [ 0, 6400 ],
        slide: function( event, ui ) {
            minHeight = Math.floor(Math.pow(ui.values[ 0 ]/100,2));
            maxHeight = Math.floor(Math.pow(ui.values[ 1 ]/100,2));
            rangeInfo('#height-range-text', minHeight, 'Height', maxHeight);

            if(requestupdateTimer != null){
                clearTimeout(requestupdateTimer);
            }
            requestupdateTimer = setTimeout(
                function() {
                    nextIndex = images.length - 1;
                    $('#images').empty();
                    nextImages();
                }, 100
            );
        }
    });

    $( '#time-range' ).slider({
        range: true,
        min: 0,
        max: 1,
        values: [ 0, 1 ],
        slide: function( event, ui ) {
            minTime = ui.values[ 0 ];
            maxTime = ui.values[ 1 ];
            rangeInfo('#time-range-text', filterDate(minTime), 'Time', filterDate(maxTime));

            if(requestupdateTimer != null){
                clearTimeout(requestupdateTimer);
            }
            requestupdateTimer = setTimeout(
                function() {
                    nextIndex = images.length - 1;
                    $('#images').empty();
                    nextImages();
                }, 100
            );
        }
    });

    $('#deleteimages').click(function() {
        var c = confirm('Are you sure that you want to delete all images with these filters?');
        if(c){
            console.log("rip");
            console.log(filterDate(minTime) + ' ' + filterDate(maxTime));
            chrome.runtime.sendMessage(
                    {
                        method: 'deleteImagesFiltered',
                        minWidth:minWidth,
                        maxWidth:maxWidth,
                        minHeight:minHeight,
                        maxHeight:maxHeight,
                        minTime:minTime,
                        maxTime:maxTime,
                        searchTerm:searchTerm,
                        hostnameFilter:hostnameFilter
                    },
                function ( response ){
                    minWidth = 0;
                    maxWidth = 4096;
                    minHeight = 0;
                    maxHeight = 4096;
                    minTime = 0;
                    maxTime = 1;
                    searchTerm = '';
                    hostnameFilter = '';
                    $( '#width-range' ).slider('option','values',[0,6400]);
                    $( '#height-range' ).slider('option','values',[0,6400]);
                    rangeInfo('#width-range-text', minWidth, 'Width', maxWidth);
                    rangeInfo('#height-range-text', minHeight, 'Height', maxHeight);
                    $('#images').empty();
                    getImages(true);
                }
            );
        }
    });

    $('#opensettings').click(function(){
        chrome.tabs.create({url: 'options/options.html'});
    });

    rangeInfo('#width-range-text', minWidth, 'Width', maxWidth);
    rangeInfo('#height-range-text', minHeight, 'Height', maxHeight);
    $( "#hostselect" ).selectmenu({
        change: function( event, ui ) {
            hostnameFilter = $(this).val();
            nextIndex = images.length - 1;
            $('#images').empty();
            nextImages();
        }
    });

    $(window).focus(function() {
        if($(window).scrollTop() == 0){
            getImages();
        }

    });


    $(document).mousemove(function(e){
        if(scrollingUp){
            return;
        }
        if(e.pageY - $(window).scrollTop() > 400){
            if(!hiding && ($(window).scrollTop() != 0)) {
                $("#filter_zone").clearQueue();
                $("#filter_zone").stop();
                $("#filter_zone").animate({
                    marginTop: '-200px',
                    opacity: 0
                },2000);
                hiding = true;
            }
        }else if(e.pageY - $(window).scrollTop() < 200){
            if(hiding) {
                $("#filter_zone").clearQueue();
                $("#filter_zone").stop();
                $("#filter_zone").animate({
                    marginTop: '-20px',
                    opacity: 1
                },500);
                hiding = false;
            }
        }
    });

    var lastScroll = -1;
    $(window).scroll(function() {
        if ($(window).scrollTop() == $(document).height() - $(window).height()) {
            nextImages();
        }
        if($(window).scrollTop() == 0){
            getImages();

        }
        if(lastScroll != -1){
            if(lastScroll > $(window).scrollTop()){
                if(hiding){
                    $("#filter_zone").clearQueue();
                    $("#filter_zone").stop();
                    $("#filter_zone").animate({
                        marginTop: '-20px',
                        opacity: 1
                    },500);
                    hiding = false;
                    scrollingUp = true;
                }
            }else{
                scrollingUp = false;
            }
        }
        lastScroll = $(window).scrollTop();
    });

    $(window).keypress(function(e) {
        if($('#searchbox').is(":focus")){
            return;
        }
        if(e.keyCode>= 65 && e.keyCode <= 90 || e.keyCode>= 97 && e.keyCode <= 122){
            $('#searchbox').focus();
            scrollingUp = true;
            $("#filter_zone").clearQueue();
            $("#filter_zone").stop();
            $("#filter_zone").animate({
                marginTop: '-20px',
                opacity: 1
            },500);
            hiding = false;
        }
    });


});