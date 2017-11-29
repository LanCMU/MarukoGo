$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    // var isAdmin = localStorage.getItem("isAdmin");

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

    loadHealths();

    function loadHealths() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/healths?offset=" + healthOffset + "&healthCount=" + healthCount,
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
                $("#noteHealth").find(".cloned").remove();
                $("#noteHealth").hide();
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
        newHealthGoToBedOnTime = $("#addHealthGoToBedOnTime").val() == "true";
        newHealthWakeUpOnTime = $("#addHealthWakeUpOnTime").val() == "true";
        newHealthHoursOfSleep = $("#addHealthHoursOfSleep").val();
        newHealthHaveExercise = $("#addHealthHaveExercise").val() == "true";
        newHealthThreeMeals = $("#addHealthThreeMeals").val().split("\n");
        newHealthWeight = $("#addHealthWeight").val();
        newHealthMoodDiary = $("#addHealthMoodDiary").val();

        if ($('#addHealthDatetimepicker').data("DateTimePicker").date() != null) {
            newHealthRecordTime = $('#addHealthDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryDate = JSON.stringify({
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
            data: queryDate,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            addHealthToTable(data.content);

            bindEditHealth();
            bindDeleteHealth();

            $("#addHealthWindow").modal('hide');
            clearAddHealthWindowFields();
            alert("Health added successfully!");
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
        $('#addHealthDatetimepicker').data("DateTimePicker").clear;
        $("#addHealthGoToBedOnTime").val('');
        $("#addHealthWakeUpOnTime").val('');

        $("#addHealthHoursOfSleep").val('');
        $("#addHealthHaveExercise").val('');
        $("#addHealthThreeMeals").val('');
        $("#addHealthWeight").val('');
        $("#addHealthMoodDiary").val('');
    }

    function bindDeleteHealth() {
        $(".deleteHealth").click(function () {
            var row = $(this).parent().parent();
            var name = row.find('#recordTime').text();
            if (confirm('Are you sure you want to delete this day\'s record: ' + name + '?')) {
                calId = row.attr('id');
                jQuery.ajax({
                    url: "/api/healths/" + calId,
                    type: "DELETE",
                    dataType: "json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function (data) {
                    row.remove();
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
            $('#addHealthDatetimepicker').data("DateTimePicker").date(new Date(recordTimeCol.text()));
            if (addHealthGoToBedOnTimeCol.text() == 'Yes') {
                $("#editHealthGoToBedOnTime").val('true');
            } else {
                $("#editHealthGoToBedOnTime").val('false');
            }
            if (addHealthWakeUpOnTimeCol.text() == 'Yes') {
                $("#editHealthWakeUpOnTime").val('true');
            } else {
                $("#editHealthWakeUpOnTime").val('false');
            }
            $("#editHealthHoursOfSleep").val(hoursOfSleepCol.text());
            $("#editHealthHaveExercise").val(haveExerciseCol.text());
            $("#editHealthThreeMeals").val(threeMealsCol.text());
            $("#editHealthWeight").val(weightCol.text());
            $("#editHealthMoodDiary").val(moodDiaryCol.text());
            healthId = healthRow.attr('id');
        });
    }

    $('#saveEditHealthWindow').click(function () {
        editedHealthRecordTime = null;
        if ($('#editHealthDatetimepicker').data("DateTimePicker").date() != null) {
            editedHealthRecordTime = $('#editHealthDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryDate = JSON.stringify({
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
        editedHealthGoToBedOnTime = $("#editHealthWindowGoToBedOnTime").val() == "true";
        editedHealthWakeUpOnTime = $("#editHealthWindowWakeUpOnTime").val() == "true";
        editedHealthHoursOfSleep = $("#editHealthWindowHoursOfSleep").val();
        editedHealthHaveExercise = $("#editHealthWindowHaveExercise").val() == "true";
        editedHealthThreeMeals = $("#editHealthWindowThreeMeals").val().split("\n");
        editedHealthWeight = $("#editHealthWindowWeight").val();
        editedHealthMoodDiary = $("#editHealthMoodDiary").val();

        jQuery.ajax({
            url: "/api/healths/" + healthId,
            type: "PATCH",
            dataType: "json",
            data: queryDate,
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
})