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
        $("#addUserWindow").modal('show');
    });

    $("#saveAddUserWindow").click(function () {

        newFirstName = $("#addFirstName").val();
        if (newFirstName == "") {
            alert("Please input First Name!");
            return;
        }
        newLastName = $("#addLastName").val();
        if (newLastName == "") {
            alert("Please input Last Name!");
            return;
        }
        newUserName = $("#addUserName").val();
        if (newUserName == "") {
            alert("Please input User Name! You will use it to log in later.");
            return;
        }
        newEmailAddress = $("#addEmailAddress").val();
        if (newEmailAddress == "") {
            alert("Please input Email Address!");
            return;
        }
        newPassword = $("#addPassword").val();
        if (newPassword == "") {
            alert("Please input Password!");
            return;
        }
        newConfirmPassword = $("#confirmPassword").val();
        if (newConfirmPassword == "") {
            alert("Please Confirm Password!");
            return;
        }
        if (newPassword != newConfirmPassword) {
            alert("The passwords do not match.");
            return;
        }
        if ($("#addPhoneNumber").val() != null) {
            newPhoneNumber = $("#addPhoneNumber").val();

            queryData = JSON.stringify({
                firstName: newFirstName,
                lastName: newLastName,
                userName: newUserName,
                phoneNumber: newPhoneNumber,
                emailAddress: newEmailAddress,
                password: newPassword,
                isPrime: false
            });
        } else {
            queryData = JSON.stringify({
                firstName: newFirstName,
                lastName: newLastName,
                userName: newUserName,
                emailAddress: newEmailAddress,
                password: newPassword,
                isPrime: false
            });
        }

        jQuery.ajax({
            url: "/api/users",
            type: "POST",
            dataType: "json",
            data: queryData,
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            $("#addUserWindow").modal('hide');
            clearAddUserWindowFields();
            alert("Congratulations! Now you can Sign In!");
        }).fail(function (jqXHR) {
            responseTextJson = JSON.parse(jqXHR.responseText);
            alert(responseTextJson.errorMessage);
        });
    });

    function clearAddUserWindowFields() {
        $("#addFirstName").val('');
        $("#addLastName").val('');
        $("#addUserName").val('');
        $("#addPhoneNumber").val('');
        $("#addEmailAddress").val('');
        $("#addPassword").val('');
        $("#confirmPassword").val('');
    };
})