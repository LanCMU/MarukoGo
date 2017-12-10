$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    var reviewOffset = 0;
    var reviewCount = 2;
    var reviewTotal = -1;

    var reviewId;
    var reviewRow;
    var reviewCategoryCol;
    var titleCol;
    var reviewContentCol;
    var ratingCol;
    var finishTimeCol;

    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
        clearAddReviewWindowFields();
        loadReviews();
    } else {
        $('#helloPrime').text("FREE user!");
        $("#previousReview").hide();
        $("#nextReview").hide();
        $("#reviewTable").hide();
        $("#addReview").hide();
        $('#reviewTitle').text("Sorry, the Review function is only accessible to PRIME users! ");

    }

    function loadReviews() {
        jQuery.ajax({
            url: "/api/users/" + userId + "/reviews?offset=" + reviewOffset + "&count=" + reviewCount,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        })
            .done(function (data) {
                $("#reviewRow").hide();
                $("#previousReview").show();
                $("#nextReview").show();
                $("#reviewTable").find(".cloned").remove();
                $("#reviewTable").show();

                reviewTotal = data.metadata.total;
                $("#reviewPage").text("Page " + Math.floor(reviewOffset / reviewCount + 1) + " of "
                    + (Math.ceil(reviewTotal / reviewCount)));

                if (data.content.length == 0) {
                    $("#hasReview").text("Sorry, you don't have reviews.");
                } else {
                    $("#hasReview").text("");
                    data.content.forEach(function (item) {
                        addReviewToTable(item);
                    });
                }

                bindEditReview();
                bindDeleteReview();
            })
            .fail(function (data) {
                $("#hasReview").text("Failed.");
                $("#previousReview").hide();
                $("#nextReview").hide();
                $("#reviewTable").find(".cloned").remove();
                $("#reviewTable").hide();
            })
    }

    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });

    $("#addReview").click(function () {
        $("#addReviewWindow").modal('show');
    });

    // Get Reviews.
    $("#getreviews").click(function (e) {
        e.preventDefault();
        loadReviews();
    });

    $("#nextReview").click(function (e) {
        e.preventDefault();
        if (reviewOffset + reviewCount < reviewTotal) {
            reviewOffset = reviewOffset + reviewCount;
            loadReviews();
        }
    })

    $("#previousReview").click(function (e) {
        e.preventDefault();
        if (reviewOffset - reviewCount >= 0) {
            reviewOffset = reviewOffset - reviewCount;
            loadReviews();
        }
    })

    $("#saveAddReviewWindow").click(function () {
        newReviewCategory = 0;
        if ($("#addReviewWindowReviewCategory").val() == '0') {
            newReviewCategory = 0;
        } else if ($("#addReviewWindowReviewCategory").val() == '1') {
            newReviewCategory = 1;
        } else if ($("#addReviewWindowReviewCategory").val() == '2') {
            newReviewCategory = 2;
        } else if ($("#addReviewWindowReviewCategory").val() == '3') {
            newReviewCategory = 3;
        }
        newTitle = $("#addReviewWindowTitle").val();
        if (newTitle == "") {
            alert("Please input Title!");
            return;
        }
        newReviewContent = $("#addReviewWindowReviewContent").val();
        newRating = 3;
        if ($("#addReviewWindowRating").val() == '1') {
            newRating = 1;
        } else if ($("#addReviewWindowRating").val() == '2') {
            newRating = 2;
        } else if ($("#addReviewWindowRating").val() == '3') {
            newRating = 3;
        } else if ($("#addReviewWindowRating").val() == '4') {
            newRating = 4;
        }
        if ($('#addReviewWindowDatetimepicker').data("DateTimePicker").date() != null) {
            newFinishTime = $('#addReviewWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');

            queryData = JSON.stringify({
                reviewCategory: newReviewCategory,
                title: newTitle,
                reviewContent: newReviewContent,
                rating: newRating,
                finishTime: newFinishTime
            });
        } else {
            queryData = JSON.stringify({
                reviewCategory: newReviewCategory,
                title: newTitle,
                reviewContent: newReviewContent,
                rating: newRating
            });
        }

        jQuery.ajax({
            url: "/api/users/" + userId + "/reviews",
            type: "POST",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // addReviewToTable(data.content);
            bindEditReview();
            bindDeleteReview();

            $("#addReviewWindow").modal('hide');
            clearAddReviewWindowFields();
            alert("Review added successfully!");
            loadReviews();
        }).fail(function (jqXHR) {
            responseTextJson = JSON.parse(jqXHR.responseText);
            alert(responseTextJson.errorMessage);
        });
    });

    function addReviewToTable(item) {
        $("#reviewRow").clone().prop("id", item.id).appendTo("#reviewTable");
        if (item.reviewCategory == 0) {
            $("#" + item.id).find("#reviewCategory").text("Movie");
        } else if (item.reviewCategory == 1) {
            $("#" + item.id).find("#reviewCategory").text("Book");
        } else if (item.reviewCategory == 2) {
            $("#" + item.id).find("#reviewCategory").text("Music");
        } else if (item.reviewCategory == 3) {
            $("#" + item.id).find("#reviewCategory").text("Others");
        }
        $("#" + item.id).find("#title").text(item.title);
        $("#" + item.id).find("#reviewContent").text(item.reviewContent);
        $("#" + item.id).find("#rating").text(item.rating);
        if (item.rating == 1) {
            $("#" + item.id).find("#rating").text("1 Star");
        } else if (item.rating == 2) {
            $("#" + item.id).find("#rating").text("2 Stars");
        } else if (item.rating == 3) {
            $("#" + item.id).find("#rating").text("3 Stars");
        } else if (item.rating == 4) {
            $("#" + item.id).find("#rating").text("4 Stars");
        } else if (item.rating == 5) {
            $("#" + item.id).find("#rating").text("5 Stars");
        }
        $("#" + item.id).find("#finishTime").text(item.finishTime);
        $("#" + item.id).prop("class", "cloned");
        $("#" + item.id).show();
    }

    function clearAddReviewWindowFields() {
        $("#addReviewWindowReviewCategory").val('Movie');
        $("#addReviewWindowTitle").val('');
        $("#addReviewWindowReviewContent").val('');
        $("#addReviewWindowRating").val('3 Stars');
        $('#addReviewWindowDatetimepicker').data("DateTimePicker").clear();
    }

    function bindDeleteReview() {
        $(".deleteReview").click(function () {
            var row = $(this).parent().parent();
            var name = row.find('#title').text();
            if (confirm('Are you sure you want to delete this review: ' + name + '?')) {
                reviewId = row.attr('id');
                jQuery.ajax({
                    url: "/api/reviews/" + reviewId,
                    type: "DELETE",
                    dataType: "json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"
                }).done(function (data) {
                    alert('This review ' + name + ' is deleted successfully! We\'ll go back to the first page!');
                    reviewOffset = 0;
                    loadReviews();
                });
            }
        });
    }

    function bindEditReview() {
        $(".editReview").click(function () {
            reviewRow = $(this).parent().parent();
            reviewCategoryCol = reviewRow.find('#reviewCategory');
            titleCol = reviewRow.find('#title');
            reviewContentCol = reviewRow.find('#reviewContent');
            ratingCol = reviewRow.find('#rating');
            finishTimeCol = reviewRow.find('#finishTime');
            $("#editReviewWindow").modal('show');
        });

        $("#editReviewWindow").on('show.bs.modal', function () {

            $("#editReviewWindowReviewCategory").val(reviewCategoryCol.text());
            $("#editReviewWindowTitle").val(titleCol.text());
            $("#editReviewWindowReviewContent").val(reviewContentCol.text());
            $("#editReviewWindowRating").val(ratingCol.text());
            if (finishTimeCol.text() == '') {
                $('#editReviewWindowDatetimepicker').data("DateTimePicker").clear();
            } else {
                $('#editReviewWindowDatetimepicker').data("DateTimePicker").date(new Date(finishTimeCol.text()));
            }


            reviewId = reviewRow.attr('id');
        });
    }

    $('#saveEditReviewWindow').click(function () {
        editedReviewCategory = 0;
        if ($("#editReviewWindowReviewCategory").val() == 'Movie') {
            editedReviewCategory = 0;
        } else if ($("#editReviewWindowReviewCategory").val() == 'Book') {
            editedReviewCategory = 1;
        } else if ($("#editReviewWindowReviewCategory").val() == 'Music') {
            editedReviewCategory = 2;
        } else if ($("#editReviewWindowReviewCategory").val() == 'Others') {
            editedReviewCategory = 3;
        }
        editedTitle = $("#editReviewWindowTitle").val();
        if (editedTitle == "") {
            alert("Please input Title!");
            return;
        }
        editedReviewContent = $("#editReviewWindowReviewContent").val();
        editedRating = 3;
        if ($("#editReviewWindowRating").val() == '1 Star') {
            editedRating = 1;
        } else if ($("#editReviewWindowRating").val() == '2 Stars') {
            editedRating = 2;
        } else if ($("#editReviewWindowRating").val() == '3 Stars') {
            editedRating = 3;
        } else if ($("#editReviewWindowRating").val() == '4 Stars') {
            editedRating = 4;
        } else if ($("#editReviewWindowRating").val() == '5 Stars') {
            editedRating = 5;
        }
        editedFinishTime = null;
        if ($('#editReviewWindowDatetimepicker').data("DateTimePicker").date() != null) {
            editedFinishTime = $('#editReviewWindowDatetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD HH:mm');
            queryData = JSON.stringify({
                reviewCategory: editedReviewCategory,
                title: editedTitle,
                reviewContent: editedReviewContent,
                rating: editedRating,
                finishTime: editedFinishTime
            });
        } else {
            queryData = JSON.stringify({
                reviewCategory: editedReviewCategory,
                title: editedTitle,
                reviewContent: editedReviewContent,
                rating: editedRating
            });
        }

        jQuery.ajax({
            url: "/api/reviews/" + reviewId,
            type: "PATCH",
            dataType: "json",
            data: queryData,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            // Update immediately
            if (editedReviewCategory == 0) {
                reviewCategoryCol.text('Movie');
            } else if (editedReviewCategory == 1) {
                reviewCategoryCol.text('Book');
            } else if (editedReviewCategory == 2) {
                reviewCategoryCol.text('Music');
            } else if (editedReviewCategory == 3) {
                reviewCategoryCol.text('Others');
            }
            titleCol.text(editedTitle);
            reviewContentCol.text(editedReviewContent);
            if (editedRating == 1) {
                ratingCol.text('1 Star');
            } else if (editedRating == 2) {
                ratingCol.text('2 Stars');
            } else if (editedRating == 3) {
                ratingCol.text('3 Stars');
            } else if (editedRating == 4) {
                ratingCol.text('4 Stars');
            } else if (editedRating == 5) {
                ratingCol.text('5 Stars');
            }
            if (editedFinishTime != null) {
                finishTimeCol.text(editedFinishTime);
            }

            $("#editReviewWindow").modal('hide');
            alert("Review modified successfully!");
        });
    });
})