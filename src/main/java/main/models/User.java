package main.models;

public class User {

    String id = null;
    String firstName;
    String lastName;
    String userName;
    String phoneNumber;
    String emailAddress;
    String profilePhotoURL;
    boolean isPrime;

    public User(String firstName, String lastName, String userName, String phoneNumber,
                String emailAddress, String profilePhotoURL, boolean isPrime) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.userName = userName;
        this.phoneNumber = phoneNumber;
        this.emailAddress = emailAddress;
        this.profilePhotoURL = profilePhotoURL;
        this.isPrime = isPrime;
    }

    public void setId(String id) {
        this.id = id;
    }
}
