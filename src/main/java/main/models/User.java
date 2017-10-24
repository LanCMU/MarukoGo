package main.models;

public class User {

    String id = null;
    String firstName;
    String lastName;
    String userName;
    String phoneNumber;
    String emailAddress;
    String profilePhotoURL;

    public User(String firstName, String lastName, String userName, String phoneNumber,
                String emailAddress, String profilePhotoURL) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.userName = userName;
        this.phoneNumber = phoneNumber;
        this.emailAddress = emailAddress;
        this.profilePhotoURL = profilePhotoURL;
    }

    public void setId(String id) {
        this.id = id;
    }
}
