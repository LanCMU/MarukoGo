$(function () {
    var token = null;
    var userId = null;
    var offset = 0;
    var total = -1;

    // Note parameters.
    var noteOffset = 0;
    var noteCount = 20;
    var noteTotal = -1;


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
            })
    });
})

