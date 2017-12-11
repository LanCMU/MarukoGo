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


    // Greetings
    $('#helloName').text('Hello, ' + firstName);
    if (isPrime === "true") {
        $('#helloPrime').text("PRIME user!");
    } else {
        $('#helloPrime').text("FREE user!");
    }

    // Side Bar Management
    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });


    // Hide Events
    $("#myEvents").hide();


    // Get all the calendars
    getAllcalendars();
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


            if(data.content == 0){
                alert("You don't have a calendar yet, start add one :)");

            }else {
                $("#myCalendar").show();
                var calendars = data.content;
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
                bindShareCalendar();
            }

        }).fail(function (data) {
            offset = 0;
            total = -1;
        });
    }

    // Add Calendar Button
    $("#addCalendar").click(function(){
        $("#addFieldCalendar").modal('show');
    });

    // Save calendar button
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

            newCalendar = data.content;

            if(newCalendar.calendarName == ''){
                alert("Missing Calendar Name!");
            }
            else {
                addCalendar(newCalendar);
                bindCheckEvent();
                bindEditCalendar();
                bindDeleteCalendar();

                $("#addFieldCalendar").modal('hide');
                clearAddCalendarFields();
            }
        }).fail(function (jqXHR,textStatus,error) {
            response = jqXHR.responseJSON;
            alert(response.errorMessage);
        });
    });




    // Add calendar content
    function addCalendar(cal) {
        $("#calendarRow").clone().prop("id", cal.id).appendTo("#calendarList");
        $("#" + cal.id).find(".calendarName").text(cal.calendarName);
        $("#" + cal.id).find(".description").text(cal.description);
        $("#" + cal.id).find(".getEvent").attr("attr-cid", cal.id);
        $("#" + cal.id).show();
    }

    // Click "check events", show event table
    function bindCheckEvent() {
        $(".getEvent").click(function () {
            var calendarId = nowCalendarId = $(this).attr("attr-cid");
            nowPage = 1;
            loadEvents(calendarId);
        });
    }

    // Click "delete", pop out a window asking deletion -> calendar
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

    // Click "edit", show edit calendar window
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

                    if(newName == ''){
                        alert("Missing Calendar Name!");
                    }else {
                        // Update immediately
                        calNameCol.text(newName);
                        calDescCol.text(newDesc);
                        $("#editFieldCalendar").modal('hide');
                    }
                });
            });
        });
    }

    // Click "share", show share window
    function bindShareCalendar() {
        $(".shareCalendar").click(function(){

            if(isPrime == "false"){
                alert("Want to share with your friends? Become our prime member!");
            }
            else {
                calRow = $(this).parent().parent();
                $("#shareCalendarWindow").modal('show');
            }
        });


        $("#shareCalendarWindow").on('show.bs.modal', function () {
            $('#contacts').empty();
            jQuery.ajax({
                url: "/api/contacts/" + userId,
                type: "GET",
                dataType:"json",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader ("Authorization", token);
                },
                contentType: "application/json; charset=utf-8"
            }).done(function(data){
                var contacts = data.content;
                contacts.forEach(function (con) {
                    $('<input id = "' + con.id + '" type="checkbox" name="contact" value="' + con.email + '">  '
                        + con.contactName + ': ' + con.email + '<br>').appendTo("#contacts");
                });
            });

            $('#saveShareCalendar').click(function(){
                var recipients = $('#contacts input:checked').map(function () {
                    return this.value;
                }).get();
                var calId = calRow.attr("id");
                var link = getShareLink(calId);
                window.location.href = "mailto:"+recipients+"?subject=Checkout my awesome calendar!&body=" + link;
                $("#shareCalendarWindow").modal('hide');
            });
        });
    }

    // Get the encrypted sharing link
    function getShareLink(calId) {
        var link = null;
        jQuery.ajax({
            url: "/api/share/encrypt/" + calId,
            type: "GET",
            dataType:"json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8",
            async: false
        }).done(function(data){
            link = "http://127.0.0.1:8080/share/share.html?calendar=" + data.content;
        });
        return link;
    }


    //##########################Events#################################

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


    // Add event Button
    $("#addEvent").click(function(){
        $("#addFieldEvent").modal('show');
    });

    // Save event Button
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



    // Load Events for a calendar
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
            if(data.content == ''){
                alert("You don't have any events in this calendar, try to add some~");
                $("#myEvents").hide();
            }else{
                $("#myEvents").show();
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
                    $("#" + item.id).find(".eventTime").text(item.eventStartTime);
                    $("#" + item.id).find(".eventLocation").text(item.eventLocation);
                    $("#" + item.id).find(".eventDescription").text(item.eventDescription);
                    $("#" + item.id).find(".eventColor").text(item.eventColor);
                    $("#" + item.id).find(".importantLevel").text(item.importantLevel);
                    $("#" + item.id).prop("class", "cloned");
                    $("#" + item.id).show();
                });

                bindEditEvent();
                bindDeleteEvent();
            }

        }).fail(function (data) {
            $("#previousEvent").hide();
            $("#nextEvent").hide();
            $("#myEvents").hide();
        })
    }

    // Click "edit", show edit event window
    function bindEditEvent() {

        // Click "edit", data loaded, show window
        $(".editEvent").click(function() {
            eventRow = $(this).parent().parent();
            eventNameCol = eventRow.find('td.eventName');
            eventTimeCol = eventRow.find('td.eventTime');
            eventLocationCol = eventRow.find('td.eventLocation');
            eventDescCol = eventRow.find('td.eventDescription');
            eventColorCol = eventRow.find('td.eventColor');
            eventLevelCol = eventRow.find('td.importantLevel');
            $("#editFieldEvent").modal('show');
        });

         // edit new data and save

         //edit and assign
        $("#editFieldEvent").on('show.bs.modal', function () {
                $("#editEventNameText").val(eventNameCol.text());
                $("#editEventStartTimeText").val(eventTimeCol.text());
                $("#editEventLocationText").val(eventLocationCol.text());
                $("#editEventDescriptionText").val(eventDescCol.text());
                $("#editEventColorText").val(eventColorCol.text());
                $("#editEventLevelText").val(eventLevelCol.text());

                if (eventTimeCol.text() == '') {
                    $('#editEventStartTimeText').data("DateTimePicker").clear();
                } else {
                    $('#editEventStartTimeText').data("DateTimePicker").date(new Date(eventTimeCol.text()));
                }

                $('#saveEditEvent').click(function(){
                    newName = $("#editEventNameText").val();
                    newStart = $("#editEventStartTimeText").val();
                    newLocation = $("#editEventLocationText").val();
                    newDesc = $('#editEventDescriptionText').val();
                    newColor = $("#editEventColorText").val();
                    newLevel = $("#editEventLevelText").val();
                    eveId = eventRow.attr('id');


                    if ($('#editEventStartTimeText').data("DateTimePicker").date() != null) {
                        newStart = $('#editEventStartTimeText').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
                        queryDate = JSON.stringify({
                            eventName: newName,
                            eventStartTime: newStart,
                            eventLocation: newLocation,
                            eventDescription: newDesc,
                            eventColor: newColor,
                            importantLevel: newLevel
                        });
                    } else {
                        queryDate = JSON.stringify({
                            eventName: newName,
                            eventLocation: newLocation,
                            eventDescription: newDesc,
                            eventColor: newColor,
                            importantLevel: newLevel
                        });
                    }


                    jQuery.ajax({
                        url: "/api/events/" + eveId,
                        type: "PATCH",
                        dataType:"json",
                        data: queryDate,
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader ("Authorization", token);
                        },
                        contentType: "application/json; charset=utf-8"

                    }).done(function(data){
                        // Update immediately
                        eventNameCol.text(newName);
                        eventTimeCol.text(newStart);
                        eventLocationCol.text(newLocation);
                        eventDescCol.text(newDesc);
                        eventColorCol.text(newColor);
                        eventLevelCol.text(newLevel);

                        if (newStart != null) {
                            eventTimeCol.text(newStart);
                        }

                        $("#editFieldEvent").modal('hide');
                        alert("Successful!");
                    });
                });
            });
    }



    // Click "delete", pop out a window asking deletion -> event
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


    // Clear "add" fields
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


});


