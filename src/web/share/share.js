
$(function () {
    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    };

    var calendar = getUrlParameter('calendar');
    var calendarId;
    jQuery.ajax({
        url: "/api/share/decrypt/" + calendar,
        type: "GET",
        dataType:"json",
        contentType: "application/json; charset=utf-8",
        async: false
    }).done(function(data){
        calendarId = data.content;
        alert(calendarId);
    });


});


