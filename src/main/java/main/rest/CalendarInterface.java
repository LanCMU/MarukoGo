package main.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.result.DeleteResult;
import main.exceptions.APPBadRequestException;
import main.exceptions.APPInternalServerException;
import main.exceptions.APPNotFoundException;
import main.helpers.PATCH;
import main.models.Calendar;
import main.models.Event;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONException;
import org.json.JSONObject;


import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;


@Path("calendars")
public class CalendarInterface {

    private MongoCollection<Document> collection;
    private MongoCollection<Document> eventCollection;
    private ObjectWriter ow;

    public CalendarInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("app17-5");

        this.collection = database.getCollection("calendars");
        this.eventCollection = database.getCollection("events");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public ArrayList<Calendar> getAll() {

        ArrayList<Calendar> calendarList = new ArrayList<>();

        FindIterable<Document> results = collection.find();
        if (results == null) {
            return calendarList;
        }
        for (Document item : results) {
            Calendar calendar = new Calendar(
                    item.getString("calendarName"),
                    item.getString("discription"),
                    item.getString("userId")
            );
            calendar.setId(item.getObjectId("_id").toString());
            calendarList.add(calendar);
        }
        return calendarList;

    }


    @GET
    @Path("calendar/{name}")
    @Produces({MediaType.APPLICATION_JSON})
    public Calendar getByName(@PathParam("name") String name) {
        BasicDBObject query = new BasicDBObject();
        query.put("calendarName", name);
        Document item = collection.find(query).first();

        if (item == null) {
            throw new APPNotFoundException(0, "You don't have calendar yet :)");
        }
        Calendar calendar = new Calendar(
                item.getString("calendarName"),
                item.getString("discription"),
                item.getString("userId")
        );
        calendar.setId(item.getObjectId("_id").toString());

        return calendar;

    }

    @GET
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})

    public Calendar getOne(@PathParam("id") String id) {

        BasicDBObject query = new BasicDBObject();
        try {
            query.put("_id", new ObjectId(id));
            Document item = collection.find(query).first();

            if (item == null) {
                throw new APPNotFoundException(0, "You don't have calendar yet :)");
            }
            Calendar calendar = new Calendar(
                    item.getString("calendarName"),
                    item.getString("discription"),
                    item.getString("userId"));
            calendar.setId(item.getObjectId("_id").toString());
            return calendar;
        } catch (IllegalArgumentException e) {
            throw new APPBadRequestException(45, "Doesn't look like MongoDB ID");
        } catch (Exception e) {
            throw new APPInternalServerException(99, "Something happened, pinch me!");
        }
    }

    @GET
    @Path("{id}/events")
    @Produces({MediaType.APPLICATION_JSON})

    public ArrayList<Event> getEventinCalendar(@PathParam("id") String id) {

        ArrayList<Event> eventList = new ArrayList<Event>();

        try {
            BasicDBObject query = new BasicDBObject();
            query.put("calendarId", id);

            FindIterable<Document> results = eventCollection.find(query);
            for (Document item : results) {
                Event event = new Event(
                        item.getString("eventName"),
                        item.getString("eventStartTime"),
                        item.getString("eventEndTime"),
                        item.getString("eventLocation"),
                        item.getString("eventDiscription"),
                        item.getString("eventColor"),
                        item.getString("collabratorId"),
                        item.getString("importantLevel"),
                        item.getString("calendarId")
                );
                event.setEventId(item.getObjectId("_id").toString());
                eventList.add(event);
            }
            return eventList;

        } catch (Exception e) {
            System.out.println("EXCEPTION!!!!");
            e.printStackTrace();
            throw new APPInternalServerException(99, e.getMessage());
        }

    }


    @POST
    @Path("{id}/events")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})

    public Object create(@PathParam("id") String id, Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(33, e.getMessage());
        }
        if (!json.has("eventName"))
            throw new APPBadRequestException(55, "missing eventName");
        if (!json.has("eventStartTime"))
            throw new APPBadRequestException(55, "missing eventStartTime");
        if (!json.has("eventEndTime"))
            throw new APPBadRequestException(55, "missing eventEndTime");
        if (!json.has("eventLocation"))
            throw new APPBadRequestException(55, "missing eventLocation");
        if (!json.has("eventDiscription"))
            throw new APPBadRequestException(55, "missing eventDiscription");
        if (!json.has("eventColor"))
            throw new APPBadRequestException(55, "missing eventColor");
        Document doc = new Document("eventName", json.getString("eventName"))
                .append("eventStartTime", json.getString("eventStartTime"))
                .append("eventEndTime", json.getString("eventEndTime"))
                .append("eventLocation", json.getString("eventLocation"))
                .append("eventDiscription", json.getString("eventDiscription"))
                .append("collabratorId", json.getString("collabratorId"))
                .append("eventColor", json.getString("eventColor"))
                .append("importantLevel", json.getString("importantLevel"))
                .append("calendarId", id);
        eventCollection.insertOne(doc);
        return request;

    }


    @PATCH
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public Object update(@PathParam("id") String id, Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(33, e.getMessage());
        }

        try {

            BasicDBObject query = new BasicDBObject();
            query.put("_id", new ObjectId(id));

            Document doc = new Document();
            if (json.has("calendarName"))
                doc.append("calendarName", json.getString("calendarName"));
            if (json.has("discription"))
                doc.append("discription", json.getString("discription"));
            if (json.has("userId"))
                doc.append("userId", json.getString("userId"));
            if (json.has("displayOfCalendar"))
                doc.append("displayOfCalendar", json.getString("displayOfCalendar"));

            Document set = new Document("$set", doc);
            collection.updateOne(query, set);

        } catch (JSONException e) {
            System.out.println("Failed to create a document");

        }
        return request;
    }


    @DELETE
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})

    public Object delete(@PathParam("id") String id) {
        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));

        DeleteResult deleteResult = collection.deleteOne(query);
        if (deleteResult.getDeletedCount() < 1)
            throw new APPNotFoundException(66,"Could not delete");

        return new JSONObject();
    }








}
