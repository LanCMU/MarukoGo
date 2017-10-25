$(function() {
    var token = null;
    var userId = null;
    var offset = 0;
    var count = 20;
    var total = -1;

    var calendarId = null;
    var calendars = [];


    // User login and show greeting
    $("#myCalendar").hide();
    $("#myEvents").hide();

    $("#login").click(function (e) {
        e.preventDefault();
        jQuery.ajax({
            url: "/api/sessions",
            type: "POST",
            data: JSON.stringify({emailAddress: $("#inputEmail").val(), password: $("#inputPassword").val()}),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            var userId = data.content.userId;
            $("#greeting").text("Hello " + data.content.firstName);
            getCalendars(userId);

        }).fail(function (data) {
            $("#greeting").text("You might want to try it again");
            //$("#getCalendar").hide();
        })
    });


    // Get calendars of a user

    function getCalendars(userId) {
        jQuery.ajax({
            url: "/api/calendars/calendar/" + userId,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {

            $("#myCalendar").show();
            calendars = data.content;

            calendars.forEach(function (cal) {

                $("#calendarRow").clone().prop("id", cal.id).appendTo("#calendarList");
                $("#" + cal.id).find(".calendarName").text(cal.calendarName);
                $("#" + cal.id).find(".description").text(cal.description);
                $("#" + cal.id).find(".getEvent").attr("attr-cid",cal.id);
                $("#" + cal.id).show();
            });
            bindBtnClick();
        });
    }




    // Load events by calendar


    var nowPage = 1, maxPage = 1;
    var nowCalendarId = false;

    $("#next").click(function (e) {
        nowPage++;
        if(nowPage > maxPage){
            nowPage = maxPage;
        }

        setPageStyle();
        loadEvents(nowCalendarId);
    })

    $("#previous").click(function (e) {
        nowPage--;
        if(nowPage < 1){
            nowPage = 1;
        }
        setPageStyle();
        loadEvents(nowCalendarId);
    })
    function bindBtnClick(){
        $(".getEvent").click(function(){
            var calendarId = nowCalendarId = $(this).attr("attr-cid");
            nowPage = 1;
            loadEvents(calendarId);

        });
    }

    function setPageStyle(){
        if(nowPage<=1){
            $("#previous").parent("li").addClass("disabled");
        }else if(nowPage>=maxPage){
            $("#next").parent("li").addClass("disabled");
        }else{
            $(".page-item").removeClass("disabled");
        }
    }

    function loadEvents(calendarId) {
        if(!calendarId){
            return false;
        }
        if(nowPage < 0){
            nowPage = 1;
        }
        var pageSize = 20;
        var offset   = (nowPage - 1) * pageSize;
        jQuery.ajax({
            url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
            type: "GET",
        })
            .done(function (data) {
                total = data.metadata.total;
                maxPage = Math.ceil(total/pageSize);
                setPageStyle();

                $("#page").text("Page " + Math.floor(offset / count + 1) + " of " + (Math.ceil(total / count)));


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
            })
            .fail(function (data) {
                $("#eventlist").text("Sorry no events");
            })
    }
})

