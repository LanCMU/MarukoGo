$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    var conNameCol;
    var conEmailCol;
    var conRow;

    $('#myContacts').hide();

    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
        clearAddContactFields();
        getAllContacts();
    } else {
        $('#helloPrime').text("FREE user!");
        $('#myContacts').hide();
        $('#primeAlert').text("Sorry, the function is only accessible to PRIME users! ");

    }


    //get all contacts info
    function getAllContacts() {
        jQuery.ajax({
            url: "/api/contacts/" + userId,
            type: "GET",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function (data) {
            $("#myContacts").show();
            contacts = data.content;
            contacts.forEach(function (con) {
                $("#contactRow").clone().prop("id", con.id).appendTo("#contactList");
                $("#" + con.id).find(".contactName").text(con.contactName);
                $("#" + con.id).find(".email").text(con.email);
                $("#" + con.id).show();
            });
            bindEditContact();
            bindDeleteContact();
        }).fail(function () {
            alert("Failed to load contacts");
        });
    }


    $('#sidebarCollapse').click(function () {
        $('#sidebar').toggleClass('active');
    });

    $("#addContact").click(function(){
        $("#addFieldContact").modal('show');
    });

    $("#saveAddContact").click(function () {

        var newName = $("#addContactNameText").val();
        var newEmail = $("#addEmailText").val();

        if (newName == "") {
            alert("Please input contact name!");
            return;
        }

        if (newEmail == "") {
            alert("Please input email address!");
            return;
        }

        jQuery.ajax({
            url: "/api/contacts",
            type: "POST",
            dataType:"json",
            data: JSON.stringify({
                contactName: newName,
                email: newEmail,
                userId: userId
            }),
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", token);
            },
            contentType: "application/json; charset=utf-8"

        }).done(function(data){
                addContact(data.content);
                bindEditContact();
                bindDeleteContact();
                $("#addFieldContact").modal('hide');
                clearAddContactFields();

        }).fail(function (error) {
            alert(error.responseJSON.errorMessage);
        });
    });

    function clearAddContactFields() {
        $("#addContactNameText").val('');
        $("#addEmailText").val('');
    }

    function clearEditContactFields() {
        $("#editContactNameText").val('');
        $("#editEmailText").val('');
    }

    function bindDeleteContact() {
        $(".deleteContact").click(function(){
            var row = $(this).parent().parent();
            var name = row.find('td.contactName').text();
            if (confirm('Are you sure you want to delete contact: '+name+'?')) {
                var conId = row.attr('id');
                jQuery.ajax({
                    url: "/api/contacts/" + conId,
                    type: "DELETE",
                    dataType:"json",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    row.remove();
                });
            }
        });
    }
    
    function bindEditContact() {
        $(".editContact").click(function(){
            conRow = $(this).parent().parent();
            conNameCol = conRow.find('td.contactName');
            conEmailCol  = conRow.find('td.email');
            $("#editFieldContact").modal('show');
        });

        $("#editFieldContact").on('show.bs.modal', function () {
            $("#editContactNameText").val(conNameCol.text());
            $("#editEmailText").val(conEmailCol.text());


            var conId = conRow.attr('id');
            $('#updateContact').click(function(){
                var newName = $("#editContactNameText").val();
                var newEmail = $("#editEmailText").val();

                if (newName == "") {
                    alert("Please input contact name!");
                    return;
                }

                if (newEmail == "") {
                    alert("Please input email address!");
                    return;
                }

                jQuery.ajax({
                    url: "/api/contacts/" + conId,
                    type: "PUT",
                    dataType:"json",
                    data: JSON.stringify({
                        contactName: newName,
                        email: newEmail,
                        userId: userId
                    }),
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader ("Authorization", token);
                    },
                    contentType: "application/json; charset=utf-8"

                }).done(function(data){
                    // Update immediately

                    conNameCol.text(newName);
                    conEmailCol.text(newEmail);
                    $("#editFieldContact").modal('hide');


                });
            });
        });
    }

    function addContact(con) {
        $("#contactRow").clone().prop("id", con.id).appendTo("#contactList");
        $("#" + con.id).find(".contactName").text(con.contactName);
        $("#" + con.id).find(".email").text(con.email);
        $("#" + con.id).show();
    }


});


