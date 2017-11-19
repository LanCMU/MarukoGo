$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
//  var isAdmin = localStorage.getItem("isAdmin");

    var count = 20;
    var offset = 0;
    var total = -1;

    $("#myEvents").hide();



    //get all calendar info

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
     //       $("#" + cal.id).find(".editCalendar").attr("attr-edit", cal.id);
    //      $("#" + cal.id).find(".deleEvent").attr("attr-dele", cal.id);
            $("#" + cal.id).show();
            offset = 0;
            total = -1;


            });

            bindBtnClick();

            var name;
            var desc;
            $(".editCalendar").click(function(){
                row = $(this).parent().parent();
                name = row.find('td.calendarName');
                desc  = row.find('td.description');
                $("#editFieldCalendar").modal('show');
            });

            $("#editFieldCalendar").on('show.bs.modal', function () {
                $("#calendarNameText").val(name.text());
                $("#descripText").val(desc.text());

                calId = row.attr('id');
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
                        name.text(newName);
                        desc.text(newDesc);
                        $("#editFieldCalendar").modal('hide');
                    });
                });
            });
        })
    .fail(function (data) {
         $("#myCalendar").hide();
         $("#myCalendar").text("You don't have calendar yet :) ");
         offset = 0;
         total = -1;
        });


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
            cal = data.content;
            alert(cal.id);
            $("#calendarRow").clone().prop("id", cal.id).appendTo("#calendarList");
            $("#" + cal.id).find(".calendarName").text(cal.calendarName);
            $("#" + cal.id).find(".description").text(cal.description);
            $("#" + cal.id).find(".getEvent").attr("attr-cid", cal.id);
            $("#" + cal.id).show();

            bindBtnClick();

            $("#addFieldCalendar").modal('hide');
        });
    });



    //
    // // delete calendar info
    //
    // jQuery.ajax({
    //
    //     url: "/api/calendars/calendar/" + userId,
    //     type: "DELETE",
    //     dataType:"json",
    //     beforeSend: function (xhr) {
    //         xhr.setRequestHeader ("Authorization", token);
    //     },
    //     contentType: "application/json; charset=utf-8"
    //
    // }).done(function(data){
    //
    //     //edit field come out
    //
    //
    // })





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

    function bindBtnClick() {
        $(".getEvent").click(function () {
            var calendarId = nowCalendarId = $(this).attr("attr-cid");
            nowPage = 1;
            loadEvents(calendarId);
            $("#myEvents").show();
        });
    }



    // function deleBtnClick() {
    //     $(".deleEvent").click(function () {
    //         var calendarId = nowCalendarId = $(this).attr("attr-dele");
    //
    //     });
    // }



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
        }).fail(function (data) {
            $("#eventlist").text("Sorry no events");
            $("#previousEvent").hide();
            $("#nextEvent").hide();
            $("#myEvents").hide();
        })
    }



    // edit event

    // jQuery.ajax({
    //
    //     url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
    //     type: "PATCH",
    //     dataType: "json",
    //     contentType: "application/json; charset=utf-8"
    //
    // }).done(function (data) {
    //     total = data.metadata.total;
    //
    //     //come out edit field
    //
    // })




    // delete event

    // jQuery.ajax({
    //
    //     url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
    //     type: "DELETE",
    //     dataType: "json",
    //     contentType: "application/json; charset=utf-8"
    //
    // }).done(function (data) {
    //     total = data.metadata.total;
    //
    //     //come out edit field
    //
    // })



    // post a new event on the calendar

    // jQuery.ajax({
    //
    //     url: "/api/calendars/" + calendarId + "/events?offset=" + offset + "&count=" + pageSize,
    //     type: "POST",
    //     dataType: "json",
    //     contentType: "application/json; charset=utf-8"
    //
    // }).done(function (data) {
    //     total = data.metadata.total;
    //
    //     //come out edit field
    //
    // })


    $("#addEvent").click(function(){
        $("#addFieldEvent").modal('show');
    });

});


