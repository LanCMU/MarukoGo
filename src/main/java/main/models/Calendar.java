package main.models;

public class Calendar {
    String id = null;
    String calendarName, discription, userId;


    public Calendar(String userId, String calendarName, String discription) {
        this.calendarName = calendarName;
        this.discription = discription;
        this.userId = userId;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() { return userId; }
}

