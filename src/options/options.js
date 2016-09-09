/**
 * Created by Diogo on 21/07/2016.
 */
var ignoreWidth = 0, ignoreHeight = 0;
var disabledWebsites = [];
var saveIncognito = false;

function loadSettings(){
    chrome.storage.sync.get({
        ignoreWidth: 65,
        ignoreHeight: 65,
        disabledWebsites: [],
        saveIncognito: false
    }, function(items) {
        ignoreWidth = items.ignoreWidth;
        ignoreHeight = items.ignoreHeight;
        disabledWebsites = items.disabledWebsites;
        saveIncognito = items.saveIncognito;
        $('#ignore-width').val(ignoreWidth);
        $('#ignore-height').val(ignoreHeight);
        $('#ignoredwebsites').val(disabledWebsites.join('\n'));
        if(saveIncognito){
            $('#incognito').prop('checked', true);
        }
    });
}

function updateStatus(str){
    $('#status').html(str);
    setTimeout(function() {
        $('#status').empty();
    }, 1000);
}
function saveSettings(){
    disabledWebsites = $('#ignoredwebsites').val().split('\n');
    chrome.storage.sync.set({
        ignoreWidth: ignoreWidth,
        ignoreHeight: ignoreHeight,
        disabledWebsites: disabledWebsites,
        saveIncognito: saveIncognito
    }, function() {
        chrome.runtime.sendMessage({method: 'updatesettings', ignoreWidth: ignoreWidth, ignoreHeight: ignoreHeight, disabledWebsites: disabledWebsites});
        updateStatus('settings saved');
    });
}

$(document).ready(function(){
    $('#ignore-width').change(function(){
        ignoreWidth = $(this).val();
    });

    $('#ignore-height').change(function(){
        ignoreHeight = $(this).val();
    });

    $('#savesettings').click(function(){
        saveSettings();
    });

    $('#delete-width-button').click(function(){
        var w = parseInt($('#delete-width').val());
        var c = confirm('Are you sure that you want to delete all images with less than ' + w + ' pixels width?');
        if(c){
            chrome.runtime.sendMessage({method: 'deleteimages', deleteWidth:w, deleteHeight: 0});
            updateStatus('images deleted');
        }
    });

    $('#delete-height-button').click(function(){
        var h = parseInt($('#delete-height').val());
        var c = confirm('Are you sure that you want to delete all images with less than ' + h + ' pixels height?');
        if(c){
            chrome.runtime.sendMessage({method: 'deleteimages', deleteWidth:0, deleteHeight: h});
            updateStatus('images deleted');
        }
    });

    $("#incognito").change(function(){
       if(this.checked){
           saveIncognito = true;
       }else{
           saveIncognito = false;
       }
    });

    chrome.storage.local.getBytesInUse(function(size){
        var units = 0;
        var byteunits = ['bytes', 'KB', 'MB', 'GB'];
        while(size > 1024){
            size /= 1024;
            units++;
        }

        $( '#storage-size').html('Extension cache is currently using ' + size.toFixed(2) + ' ' + byteunits[units]);
    });

    chrome.runtime.sendMessage({method: 'getimages'}, function(response){
        $( '#images-size').html('Number of images in picache ' + response.images.length);
    });

    loadSettings();

    $(window).focus(function() {
        loadSettings();

    });

});

