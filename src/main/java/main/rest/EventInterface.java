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
import main.exceptions.*;
import main.helpers.APPResponse;
import main.helpers.PATCH;
import main.models.Event;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONException;
import org.json.JSONObject;


import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import java.util.*;


import static main.helpers.Util.checkAuthentication;


@Path("events")
public class EventInterface {

    private MongoCollection<Document> eventCollection = null;
    private ObjectWriter ow;

    public EventInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        eventCollection = database.getCollection("events");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }


    // GET Method : GET ALL

        @GET
        @Produces({MediaType.APPLICATION_JSON})
        public APPResponse getAll() {

            ArrayList<Event> eventList = new ArrayList<>();

            try {
                FindIterable<Document> results = eventCollection.find();
                if (results == null) {
                    return new APPResponse(eventList);
                }
                for (Document item : results) {
                    Event event = new Event(
                            item.getString("eventName"),
                            item.getString("eventStartTime"),
                            item.getString("eventEndTime"),
                            item.getString("eventLocation"),
                            item.getString("eventDescription"),
                            item.getString("eventColor"),
                            item.getString("importantLevel"),
                            item.getString("calendarId"));
                    event.setEventId(item.getObjectId("_id").toString());
                    eventList.add(event);
                }
                return new APPResponse(eventList);
            } catch (Exception e) {
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Oops, there is an internal service error occurred, please try again later!");
                 }
        }

        // GET Method : Get one event by its id

        @GET
        @Path("{id}")
        @Produces({MediaType.APPLICATION_JSON})

        public APPResponse getOne (@Context HttpHeaders headers, @PathParam("id") String id){

            try {
                checkAuthentication(headers, id);
                BasicDBObject query = new BasicDBObject();


                query.put("_id", new ObjectId(id));
                Document item = eventCollection.find(query).first();

                if (item == null) {
                    throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(), "You don't have any event yet :)");
                }

                Event event = new Event(
                        item.getString("eventName"),
                        item.getString("eventStartTime"),
                        item.getString("eventEndTime"),
                        item.getString("eventLocation"),
                        item.getString("eventDescription"),
                        item.getString("eventColor"),
                        item.getString("importantLevel"),
                        item.getString("calendarId")
                );

                event.setEventId(item.getObjectId("_id").toString());
                return new APPResponse(event);
            } catch (IllegalArgumentException e) {
                throw new APPBadRequestException(ErrorCode.INVALID_MONGO_ID.getErrorCode(), "Doesn't look like MongoDB ID");
            } catch (Exception e) {
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Something happened, pinch me!");
            }
        }




        // update the info of an event

        @PATCH
        @Path("{id}")
        @Consumes({MediaType.APPLICATION_JSON})
        @Produces({MediaType.APPLICATION_JSON})
        public APPResponse update (@PathParam("id") String id, Object request){

            JSONObject json = null;
            try {
                json = new JSONObject(ow.writeValueAsString(request));
            } catch (JsonProcessingException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
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
                if (json.has("eventDescription"))
                    doc.append("eventDescription", json.getString("eventDescription"));
                if (json.has("eventColor"))
                    doc.append("eventColor", json.getString("eventColor"));
                if (json.has("importantLevel"))
                    doc.append("importantLevel", json.getString("importantLevel"));

                Document set = new Document("$set", doc);
                eventCollection.updateOne(query, set);

            } catch (JSONException e) {
                System.out.println("Failed to create a document");

            }
            return new APPResponse(request);
        }


        //DELETE METHOD : delete a calendar

        @DELETE
        @Path("{id}")
        @Produces({MediaType.APPLICATION_JSON})


        public APPResponse delete (@PathParam("id") String id){
            BasicDBObject query = new BasicDBObject();
            query.put("_id", new ObjectId(id));

            DeleteResult deleteResult = eventCollection.deleteOne(query);
            if (deleteResult.getDeletedCount() < 1)
                throw new APPNotFoundException(ErrorCode.COULD_NOT_DELETE.getErrorCode(), "Could not delete");

            return new APPResponse();
        }

    }
