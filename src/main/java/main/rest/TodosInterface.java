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
import main.models.Todo;
import org.bson.Document;
import org.bson.types.ObjectId;
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

@Path("todos")
public class TodosInterface {
    private MongoCollection<Document> collection = null;
    private ObjectWriter ow;

    public TodosInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        collection = database.getCollection("todos");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll(@DefaultValue("_id") @QueryParam("sort") String sortArg) {

        ArrayList<Todo> todoList = new ArrayList<Todo>();

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
                Todo todo = new Todo(
                        item.getString("userId"),
                        item.getString("todoCategory"),
                        item.getString("todoContent"),
                        item.getBoolean("isImportant"),
                        Util.getStringFromDate(item, "dueDate"),
                        item.getBoolean("isFinished")
                );
                todo.setId(item.getObjectId("_id").toString());
                todoList.add(todo);
            }
            return new APPResponse(todoList);

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
                        "No such todo " + id);
            }
            Todo todo = new Todo(
                    item.getString("userId"),
                    item.getString("todoCategory"),
                    item.getString("todoContent"),
                    item.getBoolean("isImportant"),
                    Util.getStringFromDate(item, "dueDate"),
                    item.getBoolean("isFinished")
            );
            todo.setId(item.getObjectId("_id").toString());

            // Make sure these todos belongs to the user.
            Util.checkAuthentication(headers, todo.getUserId());

            return new APPResponse(todo);

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

//    @GET
//    @Path("share/{id}")
//    @Produces({MediaType.APPLICATION_JSON})
//    public APPResponse getOne(@Context HttpHeaders headers, @PathParam("id") String id){
//        // convert share id to _id, and return the data
//}
//
//    @GET
//    @Path("get_share_id/{id}")
//    @Produces({MediaType.APPLICATION_JSON})
//    public APPResponse getOne(@Context HttpHeaders headers, @PathParam("id") String id){
//        // conver _id to share id
//}

        @PATCH
    @Path("{id}")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse update(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            // Make sure these todos belongs to the user.
            APPResponse response = getOne(headers, id);
            Todo todo = (Todo) response.content;
            Util.checkAuthentication(headers, todo.getUserId());
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
        if (json.has("shareId")) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                    "Share ID is unmodifiable!");
        }
        if (json.has("todoCategory")) {
            try {
                doc.append("todoCategory", json.getString("todoCategory"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Todo Category!");
            }
        }
        if (json.has("todoContent")) {
            try {
                doc.append("todoContent", json.getString("todoContent"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Todo Content!");
            }
        }
        if (json.has("isImportant")) {
            try {
                doc.append("isImportant", json.getBoolean("isImportant"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isImportant Value!");
            }
        }
        if (json.has("dueDate")) {
            try {
                doc.append("dueDate", Util.getDateFromString(json, "dueDate"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid dueDate!");
            } catch (ParseException e) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Due Date should be " + Util.DATE_FORMAT);
            }
        }
        if (json.has("isFinished")) {
            try {
                doc.append("isFinished", json.getBoolean("isFinished"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isFinished Value!");
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
            // Make sure these todos belongs to the user.
            APPResponse response = getOne(headers, id);
            Todo todo = (Todo) response.content;
            Util.checkAuthentication(headers, todo.getUserId());
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
                    "Could not delete todo " + id);
        }
        return new APPResponse();
    }
}
