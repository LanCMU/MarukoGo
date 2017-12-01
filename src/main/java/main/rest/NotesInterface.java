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
import main.helpers.Util;
import main.models.Note;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;




@Path("notes")
public class NotesInterface {

    private MongoCollection<Document> collection = null;
    private ObjectWriter ow;

    public NotesInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        collection = database.getCollection("notes");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll(@DefaultValue("_id") @QueryParam("sort") String sortArg) {

        ArrayList<Note> noteList = new ArrayList<Note>();

        BasicDBObject sortParams = new BasicDBObject();
        List<String> sortList = Arrays.asList(sortArg.split(","));
        sortList.forEach(sortItem -> {
            if (sortItem.startsWith("-")) {
                sortParams.put(sortItem.substring(1, sortItem.length()), -1); // Descending order.
            } else {
                sortParams.put(sortItem, 1); // Ascending order.
            }
        });

        try {
            FindIterable<Document> results = collection.find().sort(sortParams);
            for (Document item : results) {
                Note note = new Note(
                        item.getString("userId"),
                        item.getString("noteCaption"),
                        (List<String>) item.get("noteContent"),
                        item.getInteger("noteType"),
                        item.getBoolean("isPinned"),
                        Util.getStringFromDate(item, "remindTime")
                );
                note.setId(item.getObjectId("_id").toString());
                noteList.add(note);
            }
            return new APPResponse(noteList);

        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getOne(@Context HttpHeaders headers, @PathParam("id") String id) {

        BasicDBObject query = new BasicDBObject();

        try {
            query.put("_id", new ObjectId(id));
            Document item = collection.find(query).first();
            if (item == null) {
                throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                        "No such note " + id);
            }
            Note note = new Note(
                    item.getString("userId"),
                    item.getString("noteCaption"),
                    (List<String>) item.get("noteContent"),
                    item.getInteger("noteType"),
                    item.getBoolean("isPinned"),
                    Util.getStringFromDate(item, "remindTime")
            );
            note.setId(item.getObjectId("_id").toString());

            // Make sure this note belongs to the user.
            Util.checkAuthentication(headers, note.getUserId());

            return new APPResponse(note);

        } catch (APPNotFoundException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw new APPBadRequestException(ErrorCode.INVALID_MONGO_ID.getErrorCode(),
                    "Invalid MongoDB ID!");
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @PATCH
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse update(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            // Make sure this note belongs to the user.
            APPResponse response = getOne(headers, id);
            Note note = (Note) response.content;
            Util.checkAuthentication(headers, note.getUserId());
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));

        Document doc = new Document();
        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                    "User ID is unmodifiable!");
        }
        if (json.has("noteCaption")) {
            try {
                doc.append("noteCaption", json.getString("noteCaption"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Note Caption!");
            }
        }
        if (json.has("noteContent")) {
            try {
                List<String> noteContentList = new ArrayList<String>();
                JSONArray noteContentArray = json.getJSONArray("noteContent");
                for (int i = 0; i < noteContentArray.length(); i++) {
                    noteContentList.add(noteContentArray.getString(i));
                }
                doc.append("noteContent", noteContentList);
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Note Content!");
            }
        }
        if (json.has("noteType")) {
            int noteType = -1;
            try {
                noteType = json.getInt("noteType");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Note Type!");
            }

            if (noteType != 0 && noteType != 1) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Note Type must be 0 or 1!");
            } else {
                doc.append("noteType", noteType);
            }
        }
        if (json.has("isPinned")) {
            try {
                doc.append("isPinned", json.getBoolean("isPinned"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isPinned Value!");
            }
        }
        if (json.has("remindTime")) {
            try {
                doc.append("remindTime", Util.getDateFromString(json, "remindTime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid remindTime!");
            } catch (ParseException e) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Remind Time should be " + Util.DATE_FORMAT);
            }
        }

        try {
            Document set = new Document("$set", doc);
            collection.updateOne(query, set);

            return new APPResponse();
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @DELETE
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse delete(@Context HttpHeaders headers, @PathParam("id") String id) {
        try {
            // Make sure this note belongs to the user.
            APPResponse response = getOne(headers, id);
            Note note = (Note) response.content;
            Util.checkAuthentication(headers, note.getUserId());
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));

        DeleteResult deleteResult;
        try {
            deleteResult = collection.deleteOne(query);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        if (deleteResult.getDeletedCount() < 1) {
            throw new APPNotFoundException(ErrorCode.COULD_NOT_DELETE.getErrorCode(),
                    "Could not delete note " + id);
        }
        return new APPResponse();
    }
}
