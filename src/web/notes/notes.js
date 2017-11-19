$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    // var isAdmin = localStorage.getItem("isAdmin");

    var noteOffset = 0;
    var noteCount = 20;
    var noteTotal = -1;

    loadNotes();

    function loadNotes() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/notes?offset=" + noteOffset + "&noteCount=" + noteCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
                $("#noteRow").hide();
                $("#previousNote").show();
                $("#nextNote").show();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").show();

                noteTotal = data.metadata.total;
                $("#notePage").text("Page " + Math.floor(noteOffset / noteCount + 1) + " of " + (Math.ceil(noteTotal / noteCount)));

                if (data.content.length == 0) {
                    $("#hasNote").text("Sorry, you don't have notes.");
                } else {
                    $("#hasNote").text("");
                    data.content.forEach(function (item) {
                        addNoteToTable(item);
                    });
                }
            })
            .fail(function (data) {
                $("#hasNote").text("Failed.");
                $("#previousNote").hide();
                $("#nextNote").hide();
                $("#noteTable").find(".cloned").remove();
                $("#noteTable").hide();
            })
    }

    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });


    $("#addNote").click(function () {
        $("#addNoteWindow").modal('show');
    });


    // Get Notes.
    $("#getnotes").click(function (e) {
        e.preventDefault();
        loadNotes();
    });

    $("#nextNote").click(function (e) {
        e.preventDefault();
        if (noteOffset + noteCount < noteTotal) {
            noteOffset = noteOffset + noteCount;
            loadNotes();
        }
    })

    $("#previousNote").click(function (e) {
        e.preventDefault();
        if (noteOffset - noteCount >= 0) {
            noteOffset = noteOffset - noteCount;
            loadNotes();
        }
    })


    $("#saveAddNoteWindow").click(function () {
        newNoteName = $("#addNoteWindowCaption").val();
        if (newNoteName == "") {
            alert("Please input note caption!");
            return;
        }

        newNoteContent = $("#addNoteWindowContent").val().split("\n");
        newNoteType = 0;
        if ($("#addNoteType").val() == '0') {
            newNoteType = 0;
        } else {
            newNoteType = 1;
        }
        newNoteIsPinned = $("#addNoteIsPinned").val() == "true"
        if ($('#addNoteDatetimepicker').data("DateTimePicker").date() != null) {
            newNoteRemindTime = $('#addNoteDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryDate = JSON.stringify({
                noteCaption: newNoteName,
                noteContent: newNoteContent,
                noteType: newNoteType,
                isPinned: newNoteIsPinned,
                remindTime: newNoteRemindTime
            });
        } else {
            queryDate = JSON.stringify({
                noteCaption: newNoteName,
                noteContent: newNoteContent,
                noteType: newNoteType,
                isPinned: newNoteIsPinned
            });
        }

        jQuery.ajax({
            url: "/api/users/" + userId + "/notes",
            type: "POST",
            dataType: "json",
            data: queryDate,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            addNoteToTable(data.content);

            // bindCheckEvent();
            // bindEditCalendar();
            // bindDeleteCalendar();

            $("#addNoteWindow").modal('hide');
            clearAddNoteWindowFields();
            alert("Note added successfully!");
        });
    });

    function addNoteToTable(item) {
        $("#noteRow").clone().prop("id", item.id).appendTo("#noteTable");
        $("#" + item.id).find("#noteCaption").text(item.noteCaption);
        $("#" + item.id).find("#noteContent").text(item.noteContent);
        if (item.noteType == 0) {
            $("#" + item.id).find("#noteType").text("Memo");
        } else {
            $("#" + item.id).find("#noteType").text("Checklist");

        }
        if (item.isPinned) {
            $("#" + item.id).find("#isPinned").text("Yes");
        } else {
            $("#" + item.id).find("#isPinned").text("No");
        }
        $("#" + item.id).find("#remindTime").text(item.remindTime);
        $("#" + item.id).prop("class", "cloned");
        $("#" + item.id).show();
    }

    function clearAddNoteWindowFields() {
        $("#addNoteWindowCaption").val('');
        $("#addNoteWindowContent").val('');
        $("#addNoteType").val('');
        $("#addNoteIsPinned").val('');
        $('#addNoteDatetimepicker').data("DateTimePicker").clear;
    }

})