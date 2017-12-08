$(function () {
    var token = localStorage.getItem("token");
    var userId = localStorage.getItem("userId");
    var firstName = localStorage.getItem("firstName");
    var isPrime = localStorage.getItem("isPrime");

    $('#helloName').text('Hello, ' + firstName);
    if (isPrime == "true") {
        $('#helloPrime').text("PRIME user!");
    } else {
        $('#helloPrime').text("FREE user!");
    }





}