$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    var count = 20;
    var offset = 0;
    var total = -1;

    var calNameCol;
    var calDescCol;
    var calRow;

    var eventRow;
    var eventNameCol;
    var eventLocationCol;
    var eventColorCol;
    var eventLevelCol;

    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
    } else {
        $('#helloPrime').text("FREE user!");
    }

    $("#myEvents").hide();

    getAllcalendars();
    //get all calendar info
    function getAllcalendars() {
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

            });

            bindCheckEvent();
            bindEditCalendar();
            bindDeleteCalendar();
        }).fail(function (data) {
            offset = 0;
            total = -1;
        });
    }


    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });


    $("#addCalendar").click(function(){
        $("#addFieldCalendar").modal('show');
    });

    $("#saveAddCalendar").click(function () {
        newName = $("#addCalendarNameText").val();
        newDesc = $("#addCalendarDescripText").val();
        jQuery.ajax({
            url: "/api/users/" + userId + "/calendars",
            type: "POST",
            dataType:"json",
            data: JSON.stringify({
                calendarName: newName,
                description: newDesc
            }),
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function(data){
            addCalendar(data.content);

            bindCheckEvent();
            bindEditCalendar();
            bindDeleteCalendar();

            $("#addFieldCalendar").modal('hide');
            clearAddCalendarFields();
        });
    });


    // Pagination management

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


    // onClick functions

    function bindCheckEvent() {
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

        $('#eventTable').attr('calendarId', calendarId);

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
                $("#eventPage").hide();
                $("#previousEvent").hide();
                $("#nextEvent").hide();
            }
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


            bindEditEvent();
            bindDeleteEvent();

        }).fail(function (data) {
            $("#eventlist").text("Sorry no events");
            $("#previousEvent").hide();
            $("#nextEvent").hide();
            $("#myEvents").hide();
        })
    }

    $("#addEvent").click(function(){
        $("#addFieldEvent").modal('show');
    });

    $("#saveAddEvent").click(function () {
        newName = $("#addEventNameText").val();
        newDesc = $('#addEventDescriptionText').val();
        newLocation = $("#addEventLocationText").val();
        newColor = $("#addEventColorText").val();
        newLevel = $("#addEventLevelText").val();
        newStart = $("#addEventStartTimeText").val();
        newEnd = $("#addEventEndTimeText").val();

        calId = $('#eventTable').attr('calendarId');
        jQuery.ajax({
            url: "/api/calendars/" + calId + "/events",
            type: "POST",
            dataType:"json",
            data: JSON.stringify({
                eventName: newName,
                eventStartTime: newStart,
                eventEndTime: newEnd,
                eventLocation: newLocation,
                eventDescription: newDesc,
                eventColor: newColor,
                importantLevel: newLevel
            }),
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function(data){
            newEvent = data.content;
            loadEvents(calId);
            $("#addFieldEvent").modal('hide');
            clearAddEventFields();
        }).fail(function(jqXHR, textStatus, error){
            response = jqXHR.responseJSON;
            alert(response.errorMessage);
        });
    });

    
    function clearAddEventFields() {
        $("#addEventNameText").val('');
        $("#addEventLocationText").val('');
        $('#addEventDescriptionText').val('');
        $("#addEventColorText").val('');
        $("#addEventLevelText").val('');
        $("#addEventStartTimeText").val('');
        $("#addEventEndTimeText").val('');
    }
    function clearAddCalendarFields() {
        $("#addCalendarNameText").val('');
        $("#addCalendarDescripText").val('');
    }


    function bindDeleteCalendar() {
        $(".deleteCalendar").click(function(){
            var row = $(this).parent().parent();
            var name = row.find('td.calendarName').text();
            if (confirm('Are you sure you want to delete calendar: '+name+'? All events will also be deleted!')) {
                calId = row.attr('id');
                jQuery.ajax({
                    url: "/api/calendars/" + calId,
                    type: "DELETE",
                    dataType:"json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    row.remove();
                    $("#previousEvent").hide();
                    $("#nextEvent").hide();
                    $("#myEvents").hide();
                });
            }
        });
    }
    
    function bindEditCalendar() {
        $(".editCalendar").click(function(){
            calRow = $(this).parent().parent();
            calNameCol = calRow.find('td.calendarName');
            calDescCol  = calRow.find('td.description');
            $("#editFieldCalendar").modal('show');
        });

        $("#editFieldCalendar").on('show.bs.modal', function () {
            $("#calendarNameText").val(calNameCol.text());
            $("#descripText").val(calDescCol.text());

            calId = calRow.attr('id');
            $('#updateCalendar').click(function(){
                newName = $("#calendarNameText").val();
                newDesc = $("#descripText").val();
                jQuery.ajax({
                    url: "/api/calendars/" + calId,
                    type: "PATCH",
                    dataType:"json",
                    data: JSON.stringify({
                        calendarName: newName,
                        description: newDesc
                    }),
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    // Update immediately
                    calNameCol.text(newName);
                    calDescCol.text(newDesc);
                    $("#editFieldCalendar").modal('hide');
                });
            });
        });
    }

    function bindEditEvent() {
        $(".editEvent").click(function(){
            eventRow = $(this).parent().parent();
            eventNameCol = eventRow.find('td.eventName');
            eventLocationCol = eventRow.find('td.eventLocation');
            eventColorCol = eventRow.find('td.eventColor');
            eventLevelCol = eventRow.find('td.importantLevel');
            $("#editFieldEvent").modal('show');
        });

        $("#editFieldEvent").on('show.bs.modal', function () {
            $("#editEventNameText").val(eventNameCol.text());
            $("#editEventLocationText").val(eventLocationCol.text());
            $("#editEventColorText").val(eventColorCol.text());
            $("#editEventLevelText").val(eventLevelCol.text());

            var eveId = eventRow.attr('id');
            $('#saveEditEvent').click(function(){
                var newName = $("#editEventNameText").val();
                var newDesc = $('#editEventDescriptionText').val();
                var newLocation = $("#editEventLocationText").val();
                var newColor = $("#editEventColorText").val();
                var newLevel = $("#editEventLevelText").val();
                var newStart = $("#editEventStartTimeText").val();
                var newEnd = $("#editEventEndTimeText").val();
                jQuery.ajax({
                    url: "/api/events/" + eveId,
                    type: "PATCH",
                    dataType:"json",
                    data: JSON.stringify({
                        eventName: newName,
                        eventStartTime: newStart,
                        eventEndTime: newEnd,
                        eventLocation: newLocation,
                        eventDescription: newDesc,
                        eventColor: newColor,
                        importantLevel: newLevel
                    }),
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    // Update immediately
                    eventNameCol.text(newName);
                    eventLocationCol.text(newLocation);
                    eventColorCol.text(newColor);
                    eventLevelCol.text(newLevel);
                    $("#editFieldEvent").modal('hide');
                });
            });
        });
    }

    function bindDeleteEvent() {
        $(".deleteEvent").click(function(){
            var row = $(this).parent().parent();
            var name = row.find('td.eventName').text();
            if (confirm('Are you sure you want to delete event: '+name+'?')) {
                eveId = row.attr('id');
                jQuery.ajax({
                    url: "/api/events/" + eveId,
                    type: "DELETE",
                    dataType:"json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    row.remove();
                });
            }
        });
    }

    function addCalendar(cal) {
        $("#calendarRow").clone().prop("id", cal.id).appendTo("#calendarList");
        $("#" + cal.id).find(".calendarName").text(cal.calendarName);
        $("#" + cal.id).find(".description").text(cal.description);
        $("#" + cal.id).find(".getEvent").attr("attr-cid", cal.id);
        $("#" + cal.id).show();
    }
});


