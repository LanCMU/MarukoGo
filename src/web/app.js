$(function() {
    var calendarId = null;


    $("#getCalendar").click(function (e) {
        e.preventDefault();
        jQuery.ajax({
            url: "/api/calendars/calendar/" + $("#inputName").val(),
            type: "GET",
            //data: JSON.stringify({calendarName: $("#inputName").val()}),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        })
            .done(function (data) {
                calendarId = data.id
                $("#greeting").text("id: " + data.id);

            })
    });


    $("#getEvent").click(function (e) {
        e.preventDefault();
        jQuery.ajax({
            url: "/api/calendars/" + calendarId + "/events",
            type: "GET"
        })

            .done(function (data) {
                data.forEach(function (item) {
                    $("#eventCard").clone().prop("id", item.id).appendTo("#eventTable");
                    $("#" + item.id).find("#eventName").text(item.eventName);
                    $("#" + item.id).find("#eventStartTime").text(item.eventStartTime);
                    $("#" + item.id).find("#eventEndTime").text(item.eventEndTime);
                    $("#" + item.id).find("#eventLocation").text(item.eventLocation);
                    $("#" + item.id).find("#importantLevel").text(item.importantLevel);
                    $("#" + item.id).prop("class", "cloned");
                    $("#" + item.id).show();
                });
            })

    });

})
