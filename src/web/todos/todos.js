$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    var todoOffset = 0;
    var todoCount = 20;
    var todoTotal = -1;

    var todoId;
    var todoRow;
    var todoCategoryCol;
    var todoContentCol;
    var isImportantCol;
    var dueDateCol;
    var isFinishedCol;


    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
        clearAddTodoWindowFields();
        loadTodos();
    } else {
        $('#helloPrime').text("FREE user!");
        $("#previousTodo").hide();
        $("#nextTodo").hide();
        $("#todoTable").hide();
        $("#addTodo").hide();
        $('#todoTitle').text("Sorry, the Todo function is only accessible to PRIME users! ");

    }

    function loadTodos() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/todos?offset=" + todoOffset + "&count=" + todoCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
                $("#todoRow").hide();
                $("#previousTodo").show();
                $("#nextTodo").show();
                $("#todoTable").find(".cloned").remove();
                $("#todoTable").show();

                todoTotal = data.metadata.total;
                $("#todoPage").text("Page " + Math.floor(todoOffset / todoCount + 1) + " of "
                    + (Math.ceil(todoTotal / todoCount)));

                if (data.content.length == 0) {
                    $("#hasTodo").text("Sorry, you don't have todos.");
                } else {
                    $("#hasTodo").text("");
                    data.content.forEach(function (item) {
                        addTodoToTable(item);
                    });
                }

                bindEditTodo();
                bindDeleteTodo();
            })
            .fail(function (data) {
                $("#hasTodo").text("Failed.");
                $("#previousTodo").hide();
                $("#nextTodo").hide();
                $("#todoTable").find(".cloned").remove();
                $("#todoTable").hide();
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

    $("#nextTodo").click(function (e) {
        e.preventDefault();
        if (todoOffset + todoCount < todoTotal) {
            todoOffset = todoOffset + todoCount;
            loadTodos();
        }
    })

    $("#previousTodo").click(function (e) {
        e.preventDefault();
        if (todoOffset - todoCount >= 0) {
            todoOffset = todoOffset - todoCount;
            loadTodos();
        }
    })

    $("#saveAddTodoWindow").click(function () {
        newTodoCategory = $("#addTodoWindowTodoCategory").val();
        newTodoContent = $("#addTodoWindowTodoContent").val();
        if (newTodoContent == "") {
            alert("Please input Todo Content!");
            return;
        }
        newTodoisImportant = $("#addTodoWindowIsImportant").val() == "false";
        newTodoisFinished = $("#addTodoWindowIsFinished").val() == "false";
        if ($('#addTodoWindowDatetimepicker').data("DateTimePicker").date() != null) {
            newTodoDueDate = $('#addTodoWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryData = JSON.stringify({
                todoCategory: newTodoCategory,
                todoContent: newTodoContent,
                isImportant: newTodoisImportant,
                dueDate: newTodoDueDate,
                isFinished: newTodoisFinished
            });
        } else {
            alert("Please input Due Date!");
            return;
        }

        jQuery.ajax({
            url: "/api/users/" + userId + "/todos",
            type: "POST",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // addTodoToTable(data.content);
            bindEditTodo();
            bindDeleteTodo();

            $("#addTodoWindow").modal('hide');
            clearAddTodoWindowFields();
            alert("Todo added successfully!");
            loadTodos();
        }).fail(function (jqXHR) {
            responseTextJson = JSON.parse(jqXHR.responseText);
            alert(responseTextJson.errorMessage);
        });
    });

    function addTodoToTable(item) {
        $("#todoRow").clone().prop("id", item.id).appendTo("#todoTable");
        $("#" + item.id).find("#todoCategory").text(item.todoCategory);
        $("#" + item.id).find("#todoContent").text(item.todoContent);
        if (item.isImportant) {
            $("#" + item.id).find("#isImportant").text("Yes");
        } else {
            $("#" + item.id).find("#isImportant").text("No");
        }
        $("#" + item.id).find("#dueDate").text(item.dueDate);
        if (item.isFinished) {
            $("#" + item.id).find("#isFinished").text("Yes");
        } else {
            $("#" + item.id).find("#isFinished").text("No");
        }

        $("#" + item.id).prop("class", "cloned");
        $("#" + item.id).show();
    }

    function clearAddTodoWindowFields() {
        $("#addTodoWindowTodoCategory").val('Study');
        $("#addTodoWindowTodoContent").val('');
        $("#addTodoWindowIsImportant").val('false');
        $('#addTodoWindowDatetimepicker').data("DateTimePicker").clear();
        $("#addTodoWindowIsFinished").val('false');
    }

    function bindDeleteTodo() {
        $(".deleteTodo").click(function () {
            var row = $(this).parent().parent();
            var name = row.find('#todoContent').text();
            if (confirm('Are you sure you want to delete this todo: ' + name + '?')) {
                todoId = row.attr('id');
                jQuery.ajax({
                    url: "/api/todos/" + todoId,
                    type: "DELETE",
                    dataType: "json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"
                }).done(function (data) {
                    alert('This todo ' + name + ' is deleted successfully! We\'ll go back to the first page!');
                    todoOffset = 0;
                    loadTodos();
                });
            }
        });
    }

    function bindEditTodo() {
        $(".editTodo").click(function () {
            todoRow = $(this).parent().parent();
            todoCategoryCol = todoRow.find('#todoCategory');
            todoContentCol = todoRow.find('#todoContent');
            isImportantCol = todoRow.find('#isImportant');
            dueDateCol = todoRow.find('#dueDate');
            isFinishedCol = todoRow.find('#isFinished');
            $("#editTodoWindow").modal('show');
        });

        $("#editTodoWindow").on('show.bs.modal', function () {
            $("#editTodoWindowTodoCategory").val(todoCategoryCol.text());
            $("#editTodoWindowTodoContent").val(todoContentCol.text());
            if (isImportantCol.text() == 'Yes') {
                $("#editTodoWindowIsImportant").val('true');
            } else {
                $("#editTodoWindowIsImportant").val('false');
            }
            $('#editTodoWindowDatetimepicker').data("DateTimePicker").date(new Date(dueDateCol.text()));
            if (isFinishedCol.text() == 'Yes') {
                $("#editTodoWindowIsFinished").val('true');
            } else {
                $("#editTodoWindowIsFinished").val('false');
            }
            todoId = todoRow.attr('id');
        });
    }

    $('#saveEditTodoWindow').click(function () {
        editedTodoCategory = $("#editTodoWindowTodoCategory").val();
        editedTodoContent = $("#editTodoWindowTodoContent").val();
        if (editedTodoContent == "") {
            alert("Please input Todo Content!");
            return;
        }
        editedTodoIsImportant = $("#editTodoWindowIsImportant").val() == "true";
        editedTodoDueDate = null;
        if ($('#editTodoWindowDatetimepicker').data("DateTimePicker").date() != null) {
            editedTodoDueDate = $('#editTodoWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
        } else {
            alert("Please input Due Date!");
            return;
        }
        editedTodoIsFinished = $("#editTodoWindowIsFinished").val() == "true";

        queryData = JSON.stringify({
            todoCategory: editedTodoCategory,
            todoContent: editedTodoContent,
            isImportant: editedTodoIsImportant,
            dueDate: editedTodoDueDate,
            isFinished: editedTodoIsFinished
        });

        jQuery.ajax({
            url: "/api/todos/" + todoId,
            type: "PATCH",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // Update immediately
            todoCategoryCol.text(editedTodoCategory);
            todoContentCol.text(editedTodoContent);
            if (editedTodoIsImportant) {
                isImportantCol.text('Yes');
            } else {
                isImportantCol.text('No');
            }
            if (editedTodoDueDate != null) {
                dueDateCol.text(editedTodoDueDate);
            }
            if (editedTodoIsFinished) {
                isFinishedCol.text('Yes');
            } else {
                isFinishedCol.text('No');
            }

            $("#editTodoWindow").modal('hide');
            alert("Todo modified successfully!");
        });
    });
})