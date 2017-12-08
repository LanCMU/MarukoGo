$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var isPrime = localStorage.getItem("isPrime");

    var todoId;
    var todoRow;
    var todoCategoryCol;
    var todoContentCol;
    var isImportantCol;
    var dueDateCol;
    var isFinishedCol;


    if (isPrime == "true") {
        alert("is prime");
        loadTodos();
    } else {
        alert("not prime");
        // hide elements, and show message for user
    }

    function loadTodos() {
        jQuery.ajax({
            // 12.7做到这里
            url: "/api/users/" + userId + "/todos?offset=" + healthOffset + "&count=" + healthCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
                $("#healthRow").hide();
                $("#previousHealth").show();
                $("#nextHealth").show();
                $("#healthTable").find(".cloned").remove();
                $("#healthTable").show();

                healthTotal = data.metadata.total;
                $("#healthPage").text("Page " + Math.floor(healthOffset / healthCount + 1) + " of "
                    + (Math.ceil(healthTotal / healthCount)));

                if (data.content.length == 0) {
                    $("#hasHealth").text("Sorry, you don't have health information.");
                } else {
                    $("#hasHealth").text("");
                    data.content.forEach(function (item) {
                        addHealthToTable(item);
                    });
                }

                bindEditHealth();
                bindDeleteHealth();
            })
            .fail(function (data) {
                $("#hasHealth").text("Failed.");
                $("#previousHealth").hide();
                $("#nextHealth").hide();
                $("#healthTable").find(".cloned").remove();
                $("#healthTable").hide();
            })
    }

    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });


    $("#addTodo").click(function () {
        $("#addTodoWindow").modal('show');
    });

    // Get Todos.
    $("#gettodos").click(function (e) {
        e.preventDefault();
        loadTodos();
    });

    $("#saveAddTodoWindow").click(function () {
        // 12.7做到这里
        newTodoGoToBedOnTime = $("#addHealthWindowGoToBedOnTime").val() == "true";
        newHealthWakeUpOnTime = $("#addHealthWindowWakeUpOnTime").val() == "true";
        newHealthHoursOfSleep = $("#addHealthWindowHoursOfSleep").val();
        newHealthHaveExercise = $("#addHealthWindowHaveExercise").val() == "true";
        newHealthThreeMeals = $("#addHealthWindowThreeMeals").val().split("\n");
        newHealthWeight = $("#addHealthWindowWeight").val();
        if (newHealthWeight == '') {
            newHealthWeight = '0';
        }
        newHealthMoodDiary = $("#addHealthWindowMoodDiary").val();

        if ($('#addHealthWindowDatetimepicker').data("DateTimePicker").date() != null) {
            newHealthRecordTime = $('#addHealthWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryData = JSON.stringify({
                recordTime: newHealthRecordTime,
                goToBedOnTime: newHealthGoToBedOnTime,
                wakeUpOnTime: newHealthWakeUpOnTime,
                hoursOfSleep: newHealthHoursOfSleep,
                haveExercise: newHealthHaveExercise,
                threeMeals: newHealthThreeMeals,
                weight: newHealthWeight,
                moodDiary: newHealthMoodDiary
            });
        } else {
            alert("Please input Record Time!");
            return;
        }

        jQuery.ajax({
            url: "/api/users/" + userId + "/healths",
            type: "POST",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // addHealthToTable(data.content);

            bindEditHealth();
            bindDeleteHealth();

            $("#addHealthWindow").modal('hide');
            clearAddHealthWindowFields();
            alert("Health added successfully!");

            loadHealths();
        }).fail(function (jqXHR) {
            responseTextJson = JSON.parse(jqXHR.responseText);
            alert(responseTextJson.errorMessage);
        });
    });

})