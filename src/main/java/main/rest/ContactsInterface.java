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
import main.exceptions.ErrorCode;
import main.helpers.APPResponse;
import main.helpers.PATCH;
import main.models.Calendar;
import main.models.Contact;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONException;
import org.json.JSONObject;

import javax.json.JsonObject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.ArrayList;


@Path("contacts")
public class ContactsInterface {

    private MongoCollection<Document> contactsCollection;
    private ObjectWriter ow;

    public ContactsInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");

        this.contactsCollection = database.getCollection("contacts");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Path("{userId}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getContactsByUserId(@PathParam("userId") String userId) {

        ArrayList<Contact> contactList = new ArrayList<>();
        //try add sort
        try
        {
            BasicDBObject query = new BasicDBObject();
            query.put("userId", userId);
            FindIterable<Document> results = contactsCollection.find(query);
            if (results == null) {
                return new APPResponse(contactList);
            }
            for (Document item : results) {
                Contact contact = new Contact(
                        item.getString("contactName"),
                        item.getString("email"),
                        item.getString("userId")
                );
                contact.setId(item.getObjectId("_id").toString());
                contactList.add(contact);
            }
            return new APPResponse(contactList);

        } catch (Exception e){
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Oops, there is an internal service error occurred, please try again later!");
        }
    }

    //POST METHOD : add a new contact
    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse create(Object request) {
        JSONObject json;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

        Document doc = getContactFromJson(json);
        contactsCollection.insertOne(doc);
        Contact contact = new Contact(
                doc.getString("contactName"), doc.getString("email"), doc.getString("userId")
        );
        contact.setId(doc.getObjectId("_id").toString());
        return new APPResponse(contact);
    }

    @PUT
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public Object update(@PathParam("id") String id, Object request) {
        //need authentication

        JSONObject json;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

        try {
            BasicDBObject query = new BasicDBObject();
            query.put("_id", new ObjectId(id));

            Document doc = getContactFromJson(json);
            Document set = new Document("$set", doc);
            contactsCollection.updateOne(query, set);

        } catch (JSONException e) {
            System.out.println("Failed to create a document");

        }
        return new APPResponse(request);
    }



    //DELETE METHOD : delete a contact
    @DELETE
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse delete( @PathParam("id") String id) {
        //need authentication

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));

        DeleteResult deleteResult;
        try {
            deleteResult = contactsCollection.deleteOne(query);
        } catch (Exception e){
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        if (deleteResult.getDeletedCount() < 1)
            throw new APPNotFoundException(ErrorCode.COULD_NOT_DELETE.getErrorCode(),
                    "Could not delete");
        return new APPResponse();
    }


    private Document getContactFromJson(JSONObject json) {
        Document doc = new Document();
        //Contact Name is required.
        if (json.has("contactName")) {
            try {
                doc.append("contactName", json.getString("contactName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "You must enter a valid contact name!");
            }
        }
        else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing contact name!");
        }

        //Contact email is required.
        if (json.has("email")) {
            try {
                doc.append("email", json.getString("email"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "You must enter a valid contact email!");
            }
        }
        else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing contact email!");
        }

        //UserId is required.
        if (json.has("userId")) {
            try {
                doc.append("userId", json.getString("userId"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "You must enter a valid user id!");
            }
        }
        else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing user id!");
        }
        return doc;
    }
}
