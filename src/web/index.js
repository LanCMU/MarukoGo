$(function () {
    // Log In.
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
                localStorage.setItem("token", data.content.token);
                localStorage.setItem("userId", data.content.userId);
                localStorage.setItem("isPrime", data.content.isPrime);
                localStorage.setItem("firstName", data.content.firstName);
                location.href = "calendar/calendar.html"
            })
            .fail(function (data) {
                $("#invalidUser").text("Invalid username/password!");
            })
    });

    $("#addUser").click(function () {
        $("#addUserwWindow").modal('show');
    });
})