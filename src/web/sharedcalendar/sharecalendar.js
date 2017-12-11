$(function () {


    var count = 20;
    var offset = 0;
    var total = -1;

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

    var myDate = new Date();
    alert(myDate.getFullYear());
    var timestamp =Date.parse(new Date());
    alert(timestamp);


   //Get Calendar Id and show contents
    var calendar = getUrlParameter('calendar');
    var calendarId;
    jQuery.ajax({
        url: "/api/share/decrypt?encryptedData=" + calendar,
        type: "GET",
        dataType:"json",
        contentType: "application/json; charset=utf-8",
        async: false
    }).done(function(data) {

            calendarId = data.content;

            if (calendarId.length == 0) {
                $('#lead').text('Your friend does not have a calendar');
                return false;
            }
            else {
                $('#lead').text('This is a calendar shared by you friend.');
            }

            jQuery.ajax({
                url: "/api/calendars/" + calendarId,
                type: "GET",
                dataType: "json",
                contentType: "application/json; charset=utf-8"
            }).done(function (data) {

                var calendarName = data.content.calendarName;
                var calendarDescription = data.content.description;
                $('#calendarName').text('Calendar Name: ' + calendarName);
                $('#calendarDescription').text('Calendar Description: ' + calendarDescription);

            });

        loadEvents(calendarId);

    })


    //Pagination

    $("#nextEvent").click(function (e) {
        e.preventDefault();
        if (offset + count < total) {
            offset = offset + count;
            loadEvents(calendarId);
        }
    })

    $("#previousEvent").click(function (e) {
        e.preventDefault();
        if (offset - count >= 0) {
            offset = offset - count;
            loadEvents(calendarId);
        }
    })


    // Load Events

     function loadEvents(calendarId) {

         if (!calendarId) {
             return false;
         }


         jQuery.ajax({
             url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + count,
             type: "GET",
             dataType: "json",
             contentType: "application/json; charset=utf-8"
         }).done(function (data) {

             total = data.metadata.total;

             $("#eventPage").text("Page " + Math.floor(offset / count + 1) + " of " + (Math.ceil(total / count)));

             if (data.content.length == 0) {
                 $("#eventPage").hide();
                 $("#previousEvent").hide();
                 $("#nextEvent").hide();
             }


             // Show event data;
             $("#shareEvents").show();
             $("#shareTable").find(".cloned").remove();
             data.content.forEach(function (item) {
                 $("#shareEventCard").clone().prop("id", item.id).appendTo("#shareTable");
                 $("#" + item.id).find(".shareEventName").text(item.eventName);
                 $("#" + item.id).find(".shareEventStartTime").text(item.eventStartTime);
                 $("#" + item.id).find(".shareEventLocation").text(item.eventLocation);
                 $("#" + item.id).find(".shareEventDescription").text(item.eventDescription);
                 $("#" + item.id).find(".shareEventImporLvl").text(item.importantLevel);
                 $("#" + item.id).prop("class", "cloned");
                 $("#" + item.id).show();

             }).fail(function (data) {
                 $("#previousEvent").hide();
                 $("#nextEvent").hide();
                 $("#shareEvents").hide();
             });

         })
     }

})
