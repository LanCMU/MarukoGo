$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    // var isAdmin = localStorage.getItem("isAdmin");

    var noteOffset = 0;
    var noteCount = 20;
    var noteTotal = -1;

    var noteId;
    var noteRow;
    var noteCaptionCol;
    var noteContentCol;
    var noteTypeCol;
    var isPinnedCol;
    var remindTimeCol;

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

                bindEditNote();
                bindDeleteNote();
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
        if ($("#addNoteWindowType").val() == '0') {
            newNoteType = 0;
        } else {
            newNoteType = 1;
        }

        newNoteIsPinned = $("#addNoteWindowIsPinned").val() == "true"

        if ($('#addNoteWindowDatetimepicker').data("DateTimePicker").date() != null) {
            newNoteRemindTime = $('#addNoteWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
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

        }).done(function () {
            // addNoteToTable(data.content);

            bindEditNote();
            bindDeleteNote();

            $("#addNoteWindow").modal('hide');
            alert("Note added successfully!");
            clearAddNoteWindowFields();

            loadNotes();
        });
    });

    function addNoteToTable(item) {
        $("#noteRow").clone().prop("id", item.id).appendTo("#noteTable");
        $("#" + item.id).find("#noteCaption").text(item.noteCaption);
        $("#" + item.id).find("#noteContent").text(item.noteContent.join("\n"));
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
        $("#addNoteWindowType").val('0');
        $("#addNoteWindowIsPinned").val('false');
        $('#addNoteWindowDatetimepicker').data("DateTimePicker").clear();
    }

    function bindDeleteNote() {
        $(".deleteNote").click(function () {
            var row = $(this).parent().parent();
            var name = row.find('#noteCaption').text();
            if (confirm('Are you sure you want to delete note: ' + name + '?')) {
                calId = row.attr('id');
                jQuery.ajax({
                    url: "/api/notes/" + calId,
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

    function bindEditNote() {
        $(".editNote").click(function () {
            noteRow = $(this).parent().parent();
            noteCaptionCol = noteRow.find('#noteCaption');
            noteContentCol = noteRow.find('#noteContent');
            noteTypeCol = noteRow.find('#noteType');
            isPinnedCol = noteRow.find('#isPinned');
            remindTimeCol = noteRow.find('#remindTime');
            $("#editNoteWindow").modal('show');
        });

        $("#editNoteWindow").on('show.bs.modal', function () {
            $("#editNoteWindowCaption").val(noteCaptionCol.text());
            $("#editNoteWindowContent").val(noteContentCol.text());
            if (noteTypeCol.text() == 'Memo') {
                $("#editNoteWindowType").val('0');
            } else {
                $("#editNoteWindowType").val('1');
            }
            if (isPinnedCol.text() == 'No') {
                $("#editNoteWindowIsPinned").val('false');
            } else {
                $("#editNoteWindowIsPinned").val('true');
            }
            if (remindTimeCol.text() == '') {
                $('#editNoteWindowDatetimepicker').data("DateTimePicker").clear();
            } else {
                $('#editNoteWindowDatetimepicker').data("DateTimePicker").date(new Date(remindTimeCol.text()));
            }

            noteId = noteRow.attr('id');

        });
    }

    $('#saveEditNoteWindow').click(function () {
        editedNoteCaption = $("#editNoteWindowCaption").val();
        if (editedNoteCaption == "") {
            alert("Please input note caption!");
            return;
        }

        editedNoteContent = $("#editNoteWindowContent").val().split("\n");

        editedNoteType = 0;
        if ($("#editNoteWindowType").val() == '0') {
            editedNoteType = 0;
        } else {
            editedNoteType = 1;
        }

        editedNoteIsPinned = $("#editNoteWindowIsPinned").val() == "true"

        editedNoteRemindTime = null;
        if ($('#editNoteWindowDatetimepicker').data("DateTimePicker").date() != null) {
            editedNoteRemindTime = $('#editNoteWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryDate = JSON.stringify({
                noteCaption: editedNoteCaption,
                noteContent: editedNoteContent,
                noteType: editedNoteType,
                isPinned: editedNoteIsPinned,
                remindTime: editedNoteRemindTime
            });
        } else {
            queryDate = JSON.stringify({
                noteCaption: editedNoteCaption,
                noteContent: editedNoteContent,
                noteType: editedNoteType,
                isPinned: editedNoteIsPinned
            });
        }

        jQuery.ajax({
            url: "/api/notes/" + noteId,
            type: "PATCH",
            dataType: "json",
            data: queryDate,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // Update immediately
            noteCaptionCol.text(editedNoteCaption);
            noteContentCol.text(editedNoteContent.join("\n"));
            if (editedNoteType == 0) {
                noteTypeCol.text('Memo');
            } else {
                noteTypeCol.text('Checklist');
            }
            if (editedNoteIsPinned) {
                isPinnedCol.text('Yes');
            } else {
                isPinnedCol.text('No');
            }
            if (editedNoteRemindTime != null) {
                remindTimeCol.text(editedNoteRemindTime);
            }

            $("#editNoteWindow").modal('hide');
            alert("Note modified successfully!");
        });
    });
})