package main.models;

public class Calendar {
    String id = null;
    String calendarName, description, userId;


    public Calendar(String userId, String calendarName, String description) {
        this.calendarName = calendarName;
        this.description = description;
        this.userId = userId;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() { return userId; }
}

