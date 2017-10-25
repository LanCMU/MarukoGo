package main.models;

public class Event {
    String id = null;
    String calendarId, eventName, eventStartTime, eventEndTime, eventLocation, eventDescription, eventColor,
    importantLevel;

    public Event(String eventName, String eventStartTime, String eventEndTime,
                 String eventLocation, String eventDescription, String eventColor,
                 String importantLevel,String calendarId){


        this.eventName = eventName;
        this.eventStartTime = eventStartTime;
        this.eventEndTime = eventEndTime;
        this.eventLocation = eventLocation;
        this.eventDescription = eventDescription;
        this.eventColor = eventColor;
        this.importantLevel = importantLevel;
        this.calendarId = calendarId;

    }

    public void setEventId(String id) {
        this.id = id;
    }
}

