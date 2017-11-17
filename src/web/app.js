$(function () {
    var token = null;
    var userId = null;
    var offset = 0;
    var count = 20;
    var total = -1;

    // Note parameters.
    var noteOffset = 0;
    var noteCount = 20;
    var noteTotal = -1;

    var calendarId = null;
    var calendars = [];


    // alert("Please use this form to login");
    // Log In.
    $("#getnotes").hide();
    $("#previousNote").hide();
    $("#nextNote").hide();
    $("#noteRow").hide();
    $("#noteTable").hide();
    $("#myCalendar").hide();
    $("#myEvents").hide();
    $("#login").click(function (e) {
        e.preventDefault();
        jQuery.ajax({
            url: "/api/sessions",
            type: "POST",
            data: JSON.stringify({userName: $("#inputUsername").val(), password: $("#inputPassword").val()}),
            dataType: "json",
            contentType: "application/json; charset=utf-8"
        })
            .done(function (data) {
                $("#greeting").text("Hello " + data.content.firstName);
                $("#getnotes").show();
                $("#previousNote").hide();
                $("#nextNote").hide();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").hide();
                $("#hasNote").text("");
                $('#notePage').text("");
                offset = 0;
                noteOffset = 0;
                total = -1;
                noteTotal = -1;
                token = data.content.token;
                userId = data.content.userId;
                localStorage.setItem("token", token);
                localStorage.setItem("userId", userId);
                getCalendars(userId);
                location.href = "calendar/calendar.html"
            })
            .fail(function (data) {
                $("#greeting").text("Invalid username/password!");
                $("#getnotes").hide();
                $("#previousNote").hide();
                $("#nextNote").hide();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").hide();
                $("#hasNote").text("");
                $('#page').text("");
                offset = 0;
                noteOffset = 0;
                total = -1;
                noteTotal = -1;
                //$("#getCalendar").hide();
            })
    });




    // Get Notes.
    $("#getnotes").click(function (e) {
        e.preventDefault();
        loadNotes();
    });

    $("#nextNote").click(function (e) {
        e.preventDefault();
        if (noteOffset + noteCount < noteTotal) {
            noteOffset = noteOffset + noteCount;
            loadNotes();
        }
    })

    $("#previousNote").click(function (e) {
        e.preventDefault();
        if (noteOffset - noteCount >= 0) {
            noteOffset = noteOffset - noteCount;
            loadNotes();

        }
    })

    function loadNotes() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/notes?offset=" + noteOffset + "&noteCount=" + noteCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
                $("#previousNote").show();
                $("#nextNote").show();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").show();

                noteTotal = data.metadata.total;
                $("#notePage").text("Page " + Math.floor(noteOffset / noteCount + 1) + " of " + (Math.ceil(noteTotal / noteCount)));

                if (data.content.length == 0) {
                    $("#hasNote").text("Sorry, you don't have notes.");
                } else {
                    $("#hasNote").text("");
                    data.content.forEach(function (item) {
                        $("#noteRow").clone().prop("id", item.id).appendTo("#noteTable");
                        $("#" + item.id).find("#noteCaption").text(item.noteCaption);
                        $("#" + item.id).find("#noteContent").text(item.noteContent);
                        if (item.noteType == 0) {
                            $("#" + item.id).find("#noteType").text("Memo");
                        } else {
                            $("#" + item.id).find("#noteType").text("Checklist");

                        }
                        if (item.isPinned) {
                            $("#" + item.id).find("#isPinned").text("Yes");
                        } else {
                            $("#" + item.id).find("#isPinned").text("No");
                        }
                        $("#" + item.id).find("#remindTime").text(item.remindTime);
                        $("#" + item.id).prop("class", "cloned");
                        $("#" + item.id).show();
                    });
                }
            })
            .fail(function (data) {
                $("#hasNote").text("Failed.");
                $("#previousNote").hide();
                $("#nextNote").hide();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").hide();
            })
    }




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
                $("#" + cal.id).find(".getEvent").attr("attr-cid", cal.id);
                $("#" + cal.id).show();
            });
            bindBtnClick();
        });
    }


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
    })

    $("#previousEvent").click(function (e) {
        nowPage--;
        if (nowPage < 1) {
            nowPage = 1;
        }
        setPageStyle();
        loadEvents(nowCalendarId);
    })


    function bindBtnClick() {
        $(".getEvent").click(function () {
            var calendarId = nowCalendarId = $(this).attr("attr-cid");
            nowPage = 1;
            loadEvents(calendarId);

        });
    }

    function setPageStyle() {
        if (nowPage <= 1) {
            $("#previousEvent").parent("li").addClass("disabled");
        } else if (nowPage >= maxPage) {
            $("#nextEvent").parent("li").addClass("disabled");
        } else {
            $(".page-item").removeClass("disabled");
        }
    }

    function loadEvents(calendarId) {
        if (!calendarId) {
            return false;
        }
        if (nowPage < 0) {
            nowPage = 1;
        }
        var pageSize = 20;
        var offset = (nowPage - 1) * pageSize;
        jQuery.ajax({
            url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
            type: "GET",
        })
            .done(function (data) {
                total = data.metadata.total;
                maxPage = Math.ceil(total / pageSize);
                setPageStyle();

                $("#eventPage").text("Page " + Math.floor(offset / count + 1) + " of " + (Math.ceil(total / count)));


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

