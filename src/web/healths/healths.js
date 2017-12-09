$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    var healthOffset = 0;
    var healthCount = 20;
    var healthTotal = -1;

    var healthId;
    var healthRow;
    var recordTimeCol;
    var goToBedOnTimeCol;
    var wakeUpOnTimeCol;
    var hoursOfSleepCol;
    var haveExerciseCol;
    var threeMealsCol;
    var weightCol;
    var moodDiaryCol;

    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
    } else {
        $('#helloPrime').text("FREE user!");
    }

    clearAddHealthWindowFields();
    loadHealths();

    function loadHealths() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/healths?offset=" + healthOffset + "&count=" + healthCount,
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


    $("#addHealth").click(function () {
        $("#addHealthWindow").modal('show');
    });

    // Get Healths.
    $("#gethealths").click(function (e) {
        e.preventDefault();
        loadHealths();
    });

    $("#nextHealth").click(function (e) {
        e.preventDefault();
        if (healthOffset + healthCount < healthTotal) {
            healthOffset = healthOffset + healthCount;
            loadHealths();
        }
    })

    $("#previousHealth").click(function (e) {
        e.preventDefault();
        if (healthOffset - healthCount >= 0) {
            healthOffset = healthOffset - healthCount;
            loadHealths();
        }
    })

    $("#saveAddHealthWindow").click(function () {
        newHealthGoToBedOnTime = $("#addHealthWindowGoToBedOnTime").val() == "true";
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

    function addHealthToTable(item) {
        $("#healthRow").clone().prop("id", item.id).appendTo("#healthTable");
        $("#" + item.id).find("#recordTime").text(item.recordTime);
        if (item.goToBedOnTime) {
            $("#" + item.id).find("#goToBedOnTime").text("Yes");
        } else {
            $("#" + item.id).find("#goToBedOnTime").text("No");
        }
        if (item.wakeUpOnTime) {
            $("#" + item.id).find("#wakeUpOnTime").text("Yes");
        } else {
            $("#" + item.id).find("#wakeUpOnTime").text("No");
        }
        $("#" + item.id).find("#hoursOfSleep").text(item.hoursOfSleep);
        if (item.haveExercise) {
            $("#" + item.id).find("#haveExercise").text("Yes");
        } else {
            $("#" + item.id).find("#haveExercise").text("No");
        }
        $("#" + item.id).find("#threeMeals").text(item.threeMeals.join("\n"));
        $("#" + item.id).find("#weight").text(item.weight);
        $("#" + item.id).find("#moodDiary").text(item.moodDiary);

        $("#" + item.id).prop("class", "cloned");
        $("#" + item.id).show();
    }

    function clearAddHealthWindowFields() {
        $('#addHealthWindowDatetimepicker').data("DateTimePicker").clear();
        $("#addHealthWindowGoToBedOnTime").val('true');
        $("#addHealthWindowWakeUpOnTime").val('true');
        $("#addHealthWindowHoursOfSleep").val('8');
        $("#addHealthWindowHaveExercise").val('true');
        $("#addHealthWindowThreeMeals").val('');
        $("#addHealthWindowWeight").val('');
        $("#addHealthWindowMoodDiary").val('');
    }

    function bindDeleteHealth() {
        $(".deleteHealth").click(function () {
            var row = $(this).parent().parent();
            var name = row.find('#recordTime').text();
            if (confirm('Are you sure you want to delete this day\'s record: ' + name + '?')) {
                healthId = row.attr('id');
                jQuery.ajax({
                    url: "/api/healths/" + healthId,
                    type: "DELETE",
                    dataType: "json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function (data) {
                    alert(name + ' health information is deleted successfully! We\'ll go back to the first page!');
                    healthOffset = 0;
                    loadHealths();
                });
            }
        });
    }

    function bindEditHealth() {
        $(".editHealth").click(function () {
            healthRow = $(this).parent().parent();
            recordTimeCol = healthRow.find('#recordTime');
            goToBedOnTimeCol = healthRow.find('#goToBedOnTime');
            wakeUpOnTimeCol = healthRow.find('#wakeUpOnTime');
            hoursOfSleepCol = healthRow.find('#hoursOfSleep');
            haveExerciseCol = healthRow.find('#haveExercise');
            threeMealsCol = healthRow.find('#threeMeals');
            weightCol = healthRow.find('#weight');
            moodDiaryCol = healthRow.find('#moodDiary');
            $("#editHealthWindow").modal('show');
        });

        $("#editHealthWindow").on('show.bs.modal', function () {
            $('#editHealthWindowDatetimepicker').data("DateTimePicker").date(new Date(recordTimeCol.text()));
            if (goToBedOnTimeCol.text() == 'Yes') {
                $("#editHealthWindowGoToBedOnTime").val('true');
            } else {
                $("#editHealthWindowGoToBedOnTime").val('false');
            }
            if (wakeUpOnTimeCol.text() == 'Yes') {
                $("#editHealthWindowWakeUpOnTime").val('true');
            } else {
                $("#editHealthWindowWakeUpOnTime").val('false');
            }
            $("#editHealthWindowHoursOfSleep").val(hoursOfSleepCol.text());
            if (haveExerciseCol.text() == 'Yes') {
                $("#editHealthHaveExercise").val('true');
            } else {
                $("#editHealthHaveExercise").val('false');
            }
            $("#editHealthWindowThreeMeals").val(threeMealsCol.text());
            $("#editHealthWindowWeight").val(weightCol.text());
            $("#editHealthWindowMoodDiary").val(moodDiaryCol.text());
            healthId = healthRow.attr('id');
        });
    }

    $('#saveEditHealthWindow').click(function () {
        editedHealthRecordTime = null;
        if ($('#editHealthWindowDatetimepicker').data("DateTimePicker").date() != null) {
            editedHealthRecordTime = $('#editHealthWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');

        } else {
            alert("Please input Record Time!");
            return;
        }
        editedHealthGoToBedOnTime = $("#editHealthWindowGoToBedOnTime").val() == "true";
        editedHealthWakeUpOnTime = $("#editHealthWindowWakeUpOnTime").val() == "true";
        editedHealthHoursOfSleep = $("#editHealthWindowHoursOfSleep").val();
        editedHealthHaveExercise = $("#editHealthWindowHaveExercise").val() == "true";
        editedHealthThreeMeals = $("#editHealthWindowThreeMeals").val().split("\n");
        editedHealthWeight = $("#editHealthWindowWeight").val();
        editedHealthMoodDiary = $("#editHealthWindowMoodDiary").val();

        queryData = JSON.stringify({
            recordTime: editedHealthRecordTime,
            goToBedOnTime: editedHealthGoToBedOnTime,
            wakeUpOnTime: editedHealthWakeUpOnTime,
            hoursOfSleep: editedHealthHoursOfSleep,
            haveExercise: editedHealthHaveExercise,
            threeMeals: editedHealthThreeMeals,
            weight: editedHealthWeight,
            moodDiary: editedHealthMoodDiary
        });

        jQuery.ajax({
            url: "/api/healths/" + healthId,
            type: "PATCH",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // Update immediately
            if (editedHealthRecordTime != null) {
                recordTimeCol.text(editedHealthRecordTime);
            }
            if (editedHealthGoToBedOnTime) {
                goToBedOnTimeCol.text('Yes');
            } else {
                goToBedOnTimeCol.text('No');
            }
            if (editedHealthWakeUpOnTime) {
                wakeUpOnTimeCol.text('Yes');
            } else {
                wakeUpOnTimeCol.text('No');
            }
            hoursOfSleepCol.text(editedHealthHoursOfSleep);
            if (editedHealthHaveExercise) {
                haveExerciseCol.text('Yes');
            } else {
                haveExerciseCol.text('No');
            }
            threeMealsCol.text(editedHealthThreeMeals.join("\n"));
            weightCol.text(editedHealthWeight);
            moodDiaryCol.text(editedHealthMoodDiary);


            $("#editHealthWindow").modal('hide');
            alert("Health modified successfully!");
        });
    });

    $("#showHealthEntries").change(function () {
        if ($("#showHealthEntries").val() == '20') {
            healthCount = 20;
        } else if ($("#showHealthEntries").val() == '50') {
            healthCount = 50;
        } else if ($("#showHealthEntries").val() == '100') {
            healthCount = 100;
        } else if ($("#showHealthEntries").val() == '200') {
            healthCount = 200;
        }

        healthOffset = 0;
        loadHealths();
    });
})