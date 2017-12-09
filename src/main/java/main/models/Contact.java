package main.models;

public class Contact {

    private String id;

    private String contactName;

    private String email;

    private String userId;

    public Contact(String contactName, String email, String userId) {
        this.contactName = contactName;
        this.email = email;
        this.userId = userId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContactName() {
        return contactName;
    }

    public String getEmail() {
        return email;
    }

    public String getUserId() {
        return userId;
    }
}
