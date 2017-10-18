package main.models;


public class Driver {
     String id = null;
     String firstName;
     String lastName;
     String emailAddress;
    public Driver(String firstName, String lastName,
               String emailAddress) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.emailAddress = emailAddress;
    }
    public void setId(String id) {
        this.id = id;
    }
}
