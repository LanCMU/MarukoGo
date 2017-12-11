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

    $("#eventHeader").hide();
    $("#eventDetail").hide();
    $("#eventTable").hide();
    $("#page").hide();
    $("#eventTitle").hide();
    $("#myEvents").hide();


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

        bindEditCalendar();
        bindDeleteCalendar();
        bindShareCalendar();
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
            url: "/api/share/encrypt?calendarId=" + calId,
            type: "GET",
            dataType:"json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8",
            async: false
        }).done(function(data){
            link = "http://127.0.0.1:8080/sharedcalendar/share.html?calendar=" + data.content;
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
        newStart = $("#addEventStartTimeText").val();
        newDesc = $('#addEventDescriptionText').val();
        newLocation = $("#addEventLocationText").val();
        newColor = $("#addEventColorText").val();
        newLevel = $("#addEventLevelText").val();

        if(newName == "" || newDesc == "" || newLocation =="" || newColor == "" || newLevel == ""){
            alert("Please input sth");
            return;
        }

        if ($('#addEventStartTimeText').data("DateTimePicker").date() != null) {
            newStart = $('#addEventStartTimeText').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryData = JSON.stringify({
                eventName: newName,
                eventStartTime: newStart,
                eventDescription: newDesc,
                eventLocation: newLocation,
                eventColor: newColor,
                importantLevel: newLevel
            });
        } else {
            queryData = JSON.stringify({
                eventName: newName,
                eventDescription: newDesc,
                eventLocation: newLocation,
                eventColor: newColor,
                importantLevel: newLevel
            });
        }

        calId = $('#eventTable').attr('calendarId');
        jQuery.ajax({
            url: "/api/calendars/" + calId + "/events",
            type: "POST",
            dataType:"json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function(data){
             if(data.content.eventName == ''){
                 alert("Missing a event name!");
             }else{
                 newEvent = data.content;
                 loadEvents(calId);
                 $("#addFieldEvent").modal('hide');
                 clearAddEventFields();

                 bindEditEvent();
                 bindDeleteEvent();
             }

        }).fail(function(jqXHR, textStatus, error){
            response = jqXHR.responseJSON;
            alert(response.errorMessage);
        });
    });

    var eventMapData = {};

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


        $("#days-wrapper .event").remove(); //clear the leftover data



        // get canvas data
        jQuery.ajax({
            url: "/api/calendars/" + calendarId + "/events?offset=0&count=1000" ,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {

                if(data.content == ''){
                    alert("You don't have any events in this calendar, try to add some~");
                    $("#eventHeader").show();
                }else{
                    $("#eventHeader").show();
                    $("#eventDetail").show();

                data.content.forEach(function (item) {
                    //insert event to calendar canvas
                    eventMapData[item.id] = item;
                    var calId = item.eventStartTime.substring(5,10);
                    var calTm = item.eventStartTime.substring(11);
                    addEventToCalendar(calId,item.eventName,calTm,item);
                    });

                adjustCalendarHeight();
                bindEditEvent();
                bindDeleteEvent();
                }
        })


        $("#detailEvent").click(function() {

            $("#eventTitle").show();
            $("#eventTable").show();
            $("#page").show();
        })

        // Get table data
        jQuery.ajax({
            url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8"
             })
            .done(function (data) {

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

            }).fail(function (data) {
            $("#previousEvent").hide();
            $("#nextEvent").hide();
            $("#myEvents").hide();
        })

    }


    // Calendar canvas

    function drawCalendarTable() {

        //current time
        var today = new Date();
        var year  = today.getFullYear();
        var month = today.getMonth()+1;
        var day   = today.getDate();


        var firstDay = new Date(year,month-1,1).getDay();//本月第一天是周几
        var dayNums  = new Date(year,month,0).getDate();//本月有几天
        var dayNumsLastMon = new Date(year,month-1,0).getDate();//上个月有几天

        //draw last month
        if(firstDay > 1 ){
            for(i=1;i<firstDay;i++){
                var tmpDayTxt = dayNumsLastMon - (firstDay-1) + i ; //
                drawCalendarTableRow(tmpDayTxt,month-1," other-month");
            }
        }

        //draw this month
        for(showDayTxt=1; showDayTxt<=dayNums; showDayTxt++){
            drawCalendarTableRow(showDayTxt,month,"");
        }

        //draw next month
        var tmpNextDay = 1;
        for(i=drawCalendarIdex;i<=35;i++){
            drawCalendarTableRow(tmpNextDay,month+1," other-month");
            tmpNextDay++;
        }
        adjustCalendarHeight();
    }

    var drawCalendarIdex = 1;

    function drawCalendarTableRow(daytxt,month,addClass){
        var rowNum = Math.ceil(drawCalendarIdex / 7);
        //日期前置补0
        if((month+"").length == 1){month = "0" + month;}
        if((daytxt+"").length == 1){daytxt = "0" + daytxt;}
        $("#day-row-"+rowNum).append('<li class="day'+addClass+'" id="'+ month + "-"+daytxt+'"><div class="date">' + daytxt + '</div></li>');
        if(drawCalendarIdex % 7 == 0){
            $("#days-wrapper").append('<ul class="days clearfix" id="day-row-' + (rowNum+1-0) + '"></ul>');
        }
        drawCalendarIdex++;

    }

    function adjustCalendarHeight(){
        for(i=1;i<=6;i++) {
            $("#day-row-" + i + " li").css("min-height", $("#day-row-" + i).height());
        }
    }


    //add event to calendar
    function addEventToCalendar(id,desc,tm,item) {
        var eventHtml = ' <div class="event">\n' +
            '<div class="event-desc" id="event-desc-'+item.id+'">' +desc +'</div>' +
            '<div class="event-time" id="event-time-'+item.id+'">' +tm + '</div>' +
            '<div class="event-btns" data-id="'+item.id+'">' +
                '<a class="editEvent" href="javascript:void(0);">Edit</a> ' +
                '<a class="deleteEvent" href="javascript:void(0);">Delete</a>' +
            '</div>'
            '</div>'
        $("#"+id).append(eventHtml);
    }

    drawCalendarTable();
    

    // Click "edit", show edit event window
    var nowEditItem = null;
    var editlock = false;

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


            // get EVT ID
            var evtId = $(this).parent().attr("data-id")
            nowEditItem  = eventMapData[evtId];



            $("#editFieldEvent").modal('show');
        });

         // edit new data and save

         //edit and assign
        $("#editFieldEvent").on('show.bs.modal', function () {
                // $("#editEventNameText").val(eventNameCol.text());
                // $("#editEventStartTimeText").val(eventTimeCol.text());
                // $("#editEventLocationText").val(eventLocationCol.text());
                // $("#editEventDescriptionText").val(eventDescCol.text());
                // $("#editEventColorText").val(eventColorCol.text());
                // $("#editEventLevelText").val(eventLevelCol.text());

                $("#editEventNameText").val(nowEditItem.eventName);
                $("#editEventStartTimeText").val(nowEditItem.eventStartTime);
                $("#editEventLocationText").val(nowEditItem.eventLocation);
                $("#editEventDescriptionText").val(nowEditItem.eventDescription);
                console.log("~~~~",nowEditItem.eventColor)
                $("#editEventColorText").val(nowEditItem.eventColor.toLowerCase());
                $("#editEventLevelText").val(nowEditItem.importantLevel);

                if (nowEditItem.eventStartTime == '') {
                    $('#editEventStartTimeText').data("DateTimePicker").clear();
                } else {
                    $('#editEventStartTimeText').data("DateTimePicker").date(new Date(nowEditItem.eventStartTime));
                }

                $('#saveEditEvent').click(function(){

                    if(editlock){
                        return ;
                    }
                    editlock = true;

                    eveId = nowEditItem.id;//eventRow.attr('id');
                    eventMapData[eveId].eventName = newName = $("#editEventNameText").val();
                    eventMapData[eveId].eventStartTime = newStart = $("#editEventStartTimeText").val();
                    eventMapData[eveId].eventLocation = newLocation = $("#editEventLocationText").val();
                    eventMapData[eveId].eventDescription = newDesc = $('#editEventDescriptionText').val();
                    eventMapData[eveId].eventColor = newColor = $("#editEventColorText").val();
                    eventMapData[eveId].importantLevel = newLevel = $("#editEventLevelText").val();


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
                        $("#event-desc-"+ eveId).html(newName);
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
                        editlock = false;
                    });
                });
            });
    }



    // Click "delete", pop out a window asking deletion -> event
    function bindDeleteEvent() {
        $(".deleteEvent").click(function(){

            //Get EVT ID
            var evtId = $(this).parent().attr("data-id")
            nowEditItem  = eventMapData[evtId];
            var eventDom = $(this).parent().parent();
            //var row = $(this).parent().parent();
            var name = nowEditItem.eventName;
            if (confirm('Are you sure you want to delete event: '+name+'?')) {
                //eveId = row.attr('id');
                jQuery.ajax({
                    url: "/api/events/" + evtId,
                    type: "DELETE",
                    dataType:"json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    eventDom.remove();

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


