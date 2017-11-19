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
import main.helpers.APPCrypt;
import main.helpers.APPListResponse;
import main.helpers.APPResponse;
import main.helpers.PATCH;
import main.models.Calendar;
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


@Path("calendars")
public class CalendarInterface {

    private MongoCollection<Document> calendarCollection;
    private MongoCollection<Document> eventCollection;
    private ObjectWriter ow;

    public CalendarInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");

        this.calendarCollection = database.getCollection("calendars");
        this.eventCollection = database.getCollection("events");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }


    // GET Method : GET ALL

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll() {

        ArrayList<Calendar> calendarList = new ArrayList<>();

        //try add sort



        try
        {
            FindIterable<Document> results = calendarCollection.find();
            if (results == null) {
                return new APPResponse(calendarList);
            }
            for (Document item : results) {
                Calendar calendar = new Calendar(
                        item.getString("calendarName"),
                        item.getString("description"),
                        item.getString("userId")
                );
                calendar.setId(item.getObjectId("_id").toString());
                calendarList.add(calendar);
            }
            return new APPResponse(calendarList);

        } catch (Exception e){
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Oops, there is an internal service error occurred, please try again later!");
        }
    }


    // GET Method : Get one calendar by its id

    @GET
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getOne(/*@Context HttpHeaders headers,*/ @PathParam("id") String id) {

        try {
            //checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();

            query.put("_id", new ObjectId(id));
            Document item = calendarCollection.find(query).first();

            if (item == null) {
                throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                        "Can't find calendar :)");
            }
            Calendar calendar = new Calendar(
                    item.getString("calendarName"),
                    item.getString("description"),
                    item.getString("userId"));
            calendar.setId(item.getObjectId("_id").toString());

            return new APPResponse(calendar);

        } catch (APPNotFoundException e){
            throw e;
        } catch (APPUnauthorizedException e){
            throw e;
        } catch (IllegalArgumentException e) {
            throw new APPBadRequestException(ErrorCode.INVALID_MONGO_ID.getErrorCode(),
                    "Doesn't look like MongoDB ID");
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Unexpected error");
        }
    }




    //GET Method : Get a calendar by user id

    @GET
    @Path("calendar/{userId}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getByUserId(@PathParam("userId") String userId) {
        ArrayList<Calendar> calendarList = new ArrayList<>();
        try{

            BasicDBObject query = new BasicDBObject();
            query.put("userId", userId);
            FindIterable<Document> items = calendarCollection.find(query);
            for (Document item : items) {
                if (item == null) {
                    throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                            "Are you sure it is the user?");
                }
                Calendar calendar = new Calendar(
                        item.getString("calendarName"),
                        item.getString("description"),
                        item.getString("userId")
                );
                calendar.setId(item.getObjectId("_id").toString());
                calendarList.add(calendar);
            }
            return new APPResponse(calendarList);

        }
        catch (APPNotFoundException e){
            throw e;
        }
        catch (Exception e){
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Unexpected Error");
        }
    }



    //GET METHOD : get all the events in a calendar
    @GET
    @Path("{id}/events")
    @Produces({MediaType.APPLICATION_JSON})

    public APPListResponse getEventinCalendar(/*@Context HttpHeaders headers,*/ @PathParam("id") String id,
                                              @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                              @DefaultValue("10") @QueryParam("count") int count,
                                              @DefaultValue("0") @QueryParam("offset") int offset
       ) {

        ArrayList<Event> eventList = new ArrayList<Event>();


        BasicDBObject sortParams = new BasicDBObject();
        List<String> sortList = Arrays.asList(sortArg.split(","));
        sortList.forEach(sortItem -> {
                    if (sortItem.startsWith("-")) {
                        sortParams.put(sortItem.substring(1, sortItem.length()), -1); // Descending order.
                    } else {
                        sortParams.put(sortItem, 1); // Ascending order.
                    }
                }
        );


        try {
            //checkAuthentication(headers, id);

            BasicDBObject query = new BasicDBObject();
            query.put("calendarId", id);

            long resultCount = eventCollection.count(query);

            FindIterable<Document> results = eventCollection.find(query).skip(offset).limit(count);
            for (Document item : results) {
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
                eventList.add(event);
            }
            return new APPListResponse(eventList, resultCount, offset, eventList.size());
        }
        catch(APPBadRequestException e){
            throw e;
        }
        catch (APPUnauthorizedException e){
            throw e;

        }
        catch (Exception e) {
            System.out.println("EXCEPTION!!!!");
            e.printStackTrace();
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(), e.getMessage());
        }
    }



    //POST METHOD : add a new calendar

    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})

    public APPResponse create( Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

        Document doc = new Document();

        //Calendar Name is required.
        if (json.has("calendarName"))
            try{
                doc.append("calendarName", json.getString("calendarName"));
            }catch (JSONException e){
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "You must enter a valid calendar name!");
            }
        else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Calendar name!");
        }

        //Calendar Description is optional
        if (json.has("description")) {
            try {
                doc.append("description", json.getString("description"));
            } catch (JSONException e) {
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Unknown error!");
            }
        }

        calendarCollection.insertOne(doc);
        return new APPResponse();
    }



    //POST METHOD : add an event to a calendar

    @POST
    @Path("{id}/events")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})

    public APPResponse create(@PathParam("id") String id, Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

    Document doc = new Document();

        //Event Name is required.

        if (json.has("eventName"))
            try{
               doc.append("eventName", json.getString("eventName"));
            }catch (JSONException e){
               throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                       "You must enter a valid event name!");
            }
        else {
                throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                        "Missing Event name!");
        }

        //Event Start time is required.

        if (json.has("eventStartTime"))
            try{
                doc.append("eventStartTime", json.getString("eventStartTime"));
            }catch (JSONException e){
                throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                        "You must choose a start time!");
        }

        //Event End time is required.

        if (json.has("eventEndTime"))
            try{
                doc.append("eventEndTime", json.getString("eventEndTime"));
            }catch (JSONException e){
                throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                        "You must choose an end time!");
            }

        //Event Location is optional

        if (json.has("eventLocation"))
            try{
                doc.append("eventLocation", json.getString("eventLocation"));
            }catch (JSONException e){
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Unknown error!");
            }


        //Event Location is optional

        if (json.has("eventDescription"))
            try{
                doc.append("eventDescription", json.getString("eventDescription"));
            }catch (JSONException e){
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Unknown error!");
            }

        //Event Color is optional

        if (json.has("eventColor"))
            try{
                doc.append("eventColor", json.getString("eventColor"));
            }catch (JSONException e){
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Unknown error!");
            }

        eventCollection.insertOne(doc);
        return new APPResponse();
    }


    @PATCH
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public Object update(@PathParam("id") String id, Object request) {


        //need authentication

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
            if (json.has("calendarName"))
                doc.append("calendarName", json.getString("calendarName"));
            if (json.has("description"))
                doc.append("description", json.getString("description"));

            Document set = new Document("$set", doc);
            calendarCollection.updateOne(query, set);

        } catch (JSONException e) {
            System.out.println("Failed to create a document");

        }
        return new APPResponse(request);
    }



    //DELETE METHOD : delete a calendar

    @DELETE
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse delete( @PathParam("id") String id) {


        //need authentication

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));


        DeleteResult deleteResult;
        try {
            deleteResult = calendarCollection.deleteOne(query);
        } catch (Exception e){
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        if (deleteResult.getDeletedCount() < 1)
            throw new APPNotFoundException(ErrorCode.COULD_NOT_DELETE.getErrorCode(),
                    "Could not delete");

        return new APPResponse();
    }

}
