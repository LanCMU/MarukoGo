package main.models;

public class Event {
    String id = null;
    String calendarId, eventName, eventStartTime, eventEndTime, eventLocation, eventDiscription, eventColor,
            collabratorId, importantLevel;

    public Event(String eventName, String eventStartTime, String eventEndTime,
                 String eventLocation, String eventDiscription, String eventColor,
                 String collabratorId, String importantLevel,String calendarId){


        this.eventName = eventName;
        this.eventStartTime = eventStartTime;
        this.eventEndTime = eventEndTime;
        this.eventLocation = eventLocation;
        this.eventDiscription = eventDiscription;
        this.eventColor = eventColor;
        this.collabratorId = collabratorId;
        this.importantLevel = importantLevel;
        this.calendarId = calendarId;

    }

    public void setEventId(String id) {
        this.id = id;
    }
}

