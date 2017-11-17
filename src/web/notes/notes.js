$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var isAdmin = localStorage.getItem("isAdmin");


    function loadNotes() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/notes?offset=" + noteOffset + "&noteCount=" + noteCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
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

}