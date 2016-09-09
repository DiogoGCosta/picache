/**
 * Created by Diogo on 20/07/2016.
 */
function filterDate(date){
    var time = date,
        timeNow = new Date().getTime(),
        difference = timeNow - time,
        seconds = Math.floor(difference / 1000),
        minutes = Math.floor(seconds / 60),
        hours = Math.floor(minutes / 60),
        days = Math.floor(hours / 24);

    var time = new Date(time);
    var timeNow = new Date(timeNow);

    var m = (time.getMinutes()<10?'0':'') + time.getMinutes();

    if (timeNow.getYear() > time.getYear() && days > 1) {
        return time.getDate() + "/" + time.getMonth()+1 + "/"  + time.getYear() + " at " + time.getHours() + ":" + m;
    }else if (timeNow.getDate() > (time.getDate()+1) || (timeNow.getMonth()>time.getMonth() && timeNow.getDate() > 1)) {
        return time.getDate() + "/" + (time.getMonth()+1) + " at " + time.getHours() + ":" + m;
    }else if (timeNow.getDate() > time.getDate() || (timeNow.getMonth()>time.getMonth())) {
        return "yesterday at " + time.getHours() + ":" + m;
    }else if (hours > 1) {
        return "today at " + time.getHours() + ":" + m;
    }else if (hours == 1) {
        return "1 hour ago";
    }else if (minutes > 1) {
        return minutes + " minutes ago";
    }else if (minutes == 1){
        return "1 minute ago";
    }else {
        return "seconds ago";
    }
}