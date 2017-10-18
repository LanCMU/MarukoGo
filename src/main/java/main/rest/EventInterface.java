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
import main.models.Event;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONException;
import org.json.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;



@Path("events")
public class EventInterface {

    private MongoCollection<Document> collection = null;
    private ObjectWriter ow;

    public EventInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("app17-5");
        collection = database.getCollection("events");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }


    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public ArrayList<Event> getAll() {

        ArrayList<Event> eventList = new ArrayList<>();

        FindIterable<Document> results = collection.find();
        if (results == null) {
            return eventList;
        }
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

    }

    @GET
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})

    public Event getOne(@PathParam("id") String id) {

        BasicDBObject query = new BasicDBObject();
        try {
            query.put("_id", new ObjectId(id));
            Document item = collection.find(query).first();

            if (item == null) {
                throw new APPNotFoundException(0, "You don't have any event yet :)");
            }
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
            return event;
        } catch (IllegalArgumentException e) {
            throw new APPBadRequestException(45, "Doesn't look like MongoDB ID");
        } catch (Exception e) {
            throw new APPInternalServerException(99, "Something happened, pinch me!");
        }
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
            if (json.has("eventName"))
                doc.append("eventName", json.getString("eventName"));
            if (json.has("eventStartTime"))
                doc.append("eventStartTime", json.getString("eventStartTime"));
            if (json.has("eventEndTime"))
                doc.append("eventEndTime", json.getString("eventEndTime"));
            if (json.has("eventLocation"))
                doc.append("eventLocation", json.getString("eventLocation"));
            if (json.has("eventDiscription"))
                doc.append("eventDiscription", json.getString("eventDiscription"));
            if (json.has("eventColor"))
                doc.append("eventColor", json.getString("eventColor"));
            if (json.has("collabratorId"))
                doc.append("collabratorId", json.getString("collabratorId"));
            if (json.has("importantLevel"))
                doc.append("importantLevel", json.getString("importantLevel"));

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
