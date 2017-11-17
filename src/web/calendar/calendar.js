$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
//  var isAdmin = localStorage.getItem("isAdmin");

    var count = 20;
    var offset = 0;
    var total = -1;

    $("#myEvents").hide();

    jQuery.ajax({

        url: "/api/calendars/calendar/" + userId,
        type: "GET",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", token);
            },
        contentType: "application/json; charset=utf-8"

    }).done(function (data) {
        $("#myCalendar").show();
        calendars = data.content;
        calendars.forEach(function (cal) {
            $("#calendarRow").clone().prop("id", cal.id).appendTo("#calendarList");
            $("#" + cal.id).find(".calendarName").text(cal.calendarName);
            $("#" + cal.id).find(".description").text(cal.description);
            $("#" + cal.id).find(".getEvent").attr("attr-cid", cal.id);
            $("#" + cal.id).show();
            offset = 0;
            total = -1;
            })
        bindBtnClick();
        })
    .fail(function (data) {
         $("#myCalendar").hide();
         $("#myCalendar").text("You don't have calendar yet :) ");
         offset = 0;
         total = -1;
        });


    // Load events by calendar

    var nowPage = 1, maxPage = 1;
    var nowCalendarId = false;

    $("#nextEvent").click(function (e) {
        nowPage++;
        if (nowPage > maxPage) {
            nowPage = maxPage;
        }
        setPageStyle();
        loadEvents(nowCalendarId);
    });

    $("#previousEvent").click(function (e) {
        nowPage--;
        if (nowPage < 1) {
            nowPage = 1;
        }
        setPageStyle();
        loadEvents(nowCalendarId);
    });


    function bindBtnClick() {
        $(".getEvent").click(function () {
            var calendarId = nowCalendarId = $(this).attr("attr-cid");
            nowPage = 1;
            loadEvents(calendarId);
            $("#myEvents").show();
        });
    }



   // Avoid pagination show inappropriately
    function setPageStyle() {
        if (nowPage <= 1) {
            $("#previousEvent").parent("li").addClass("disabled");
        } else if (nowPage >= maxPage) {
            $("#nextEvent").parent("li").addClass("disabled");
        } else {
            $(".page-item").removeClass("disabled");
        }
    }


   // Load Events
    function loadEvents(calendarId) {

        if (!calendarId) {
            return false;
        }
        if (nowPage < 0) {
            nowPage = 0;
        }
        var pageSize = 20;
        var offset = (nowPage - 1) * pageSize;


        jQuery.ajax({

            url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            total = data.metadata.total;
            maxPage = Math.ceil(total / pageSize);
            setPageStyle();
            $("#eventPage").text("Page " + Math.floor(offset / count + 1) + " of " + (Math.ceil(total / count)));

            if (data.content.length == 0) {
                $("#myEvents").hide();
                $("#previousEvent").hide();
                $("#nextEvent").hide();
                $("#eventHandle").text("You have no events yet :)");
                $("#eventHandle").hide();
        }
            else {
                $("#myEvents").show();

                $("#eventTable").find(".cloned").remove();
                data.content.forEach(function (item) {
                    $("#eventCard").clone().prop("id", item.id).appendTo("#eventTable");
                    $("#" + item.id).find(".eventName").text(item.eventName);
                    $("#" + item.id).find(".eventLocation").text(item.eventLocation);
                    $("#" + item.id).find(".eventColor").text(item.eventColor);
                    $("#" + item.id).find(".description").text(item.description);
                    $("#" + item.id).find(".importantLevel").text(item.importantLevel);
                    $("#" + item.id).prop("class", "cloned");
                    $("#" + item.id).show();
                });
            }
        }).fail(function (data) {
            $("#eventlist").text("Sorry no events");
            $("#previousEvent").hide();
            $("#nextEvent").hide();
            $("#myEvents").hide();
        })
    }

});


