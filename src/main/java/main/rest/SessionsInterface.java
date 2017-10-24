package main.rest;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import main.exceptions.APPBadRequestException;
import main.exceptions.APPInternalServerException;
import main.exceptions.APPNotFoundException;
import main.helpers.APPCrypt;
import main.helpers.APPResponse;
import main.models.Token;
import main.models.User;
import org.bson.Document;
import org.json.JSONObject;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("sessions")

public class SessionsInterface {

    private MongoCollection<Document> userCollection;
    private MongoCollection<Document> calendarCollection;
    private ObjectWriter ow;


    public SessionsInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("Maruko");

        this.userCollection = database.getCollection("users");
        this.calendarCollection = database.getCollection("calendars");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();

    }


    @POST
    @Consumes({ MediaType.APPLICATION_JSON})
    @Produces({ MediaType.APPLICATION_JSON})
    public APPResponse create(Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
            if (!json.has("userName"))
                throw new APPBadRequestException(55, "missing user name!");
            if (!json.has("password"))
                throw new APPBadRequestException(55, "missing password!");
            BasicDBObject query = new BasicDBObject();

            query.put("userName", json.getString("userName"));
            query.put("password", APPCrypt.encrypt(json.getString("password")));
            Document item = userCollection.find(query).first();
            if (item == null) {
                throw new APPNotFoundException(0, "No user found matching credentials");
            }
            User user = new User(
                    item.getString("firstName"),
                    item.getString("lastName"),
                    item.getString("userName"),
                    item.getString("phoneNumber"),
                    item.getString("emailAddress"),
                    item.getString("profilePhotoURL")
            );
            user.setId(item.getObjectId("_id").toString());
            APPResponse r = new APPResponse(new Token(user));
            return r;
        }
        catch (JsonProcessingException e) {
            throw new APPBadRequestException(33, e.getMessage());
        }
        catch (APPBadRequestException e) {
            throw e;
        }
        catch (APPNotFoundException e) {
            throw e;
        }
        catch (Exception e) {
            throw new APPInternalServerException(0, e.getMessage());
        }
    }

}



