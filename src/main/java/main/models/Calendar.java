package main.models;

public class Calendar {
    String id = null;
    String calendarName, discription, userId, displayOfCalendar;


    public Calendar(String calendarName, String discription, String userId,
                    String displayOfCalendar) {
        this.calendarName = calendarName;
        this.discription = discription;
        this.userId = userId;
        this.displayOfCalendar = displayOfCalendar;
    }
    public void setId(String id) {
        this.id = id;
    }
}

