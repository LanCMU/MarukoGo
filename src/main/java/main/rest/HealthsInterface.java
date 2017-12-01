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
import main.models.Health;
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


@Path("healths")

public class HealthsInterface {

    private MongoCollection<Document> collection = null;
    private ObjectWriter ow;

    public HealthsInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        collection = database.getCollection("healths");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll(@DefaultValue("_id") @QueryParam("sort") String sortArg) {

        ArrayList<Health> healthList = new ArrayList<Health>();

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
                Health health = new Health(
                        item.getString("userId"),
                        Util.getStringFromDate(item, "recordTime"),
                        item.getBoolean("goToBedOnTime"),
                        item.getBoolean("wakeUpOnTime"),
                        item.getInteger("hoursOfSleep"),
                        item.getBoolean("haveExercise"),
                        (List<String>) item.get("threeMeals"),
                        item.getDouble("weight"),
                        item.getString("moodDiary")
                );
                health.setId(item.getObjectId("_id").toString());
                healthList.add(health);
            }
            return new APPResponse(healthList);

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
                        "No such health record " + id);
            }
            Health health = new Health(
                    item.getString("userId"),
                    Util.getStringFromDate(item, "recordTime"),
                    item.getBoolean("goToBedOnTime"),
                    item.getBoolean("wakeUpOnTime"),
                    item.getInteger("hoursOfSleep"),
                    item.getBoolean("haveExercise"),
                    (List<String>) item.get("threeMeals"),
                    item.getDouble("weight"),
                    item.getString("moodDiary")
            );
            health.setId(item.getObjectId("_id").toString());

            // Make sure this health record belongs to the user.
            Util.checkAuthentication(headers, health.getUserId());

            return new APPResponse(health);

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
    public APPResponse update(@Context HttpHeaders headers,
                              @PathParam("id") String id, Object request) {
        try {
            // Make sure this health record belongs to the user.
            APPResponse response = getOne(headers, id);
            Health health = (Health) response.content;
            Util.checkAuthentication(headers, health.getUserId());
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
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                    e.getMessage());
        }

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));

        Document doc = new Document();
        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                    "User ID is unmodifiable!");
        }

        if (json.has("recordTime")) {
            try {
                doc.append("recordTime", Util.getDateFromString(json, "recordTime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid recordTime!");
            } catch (ParseException e) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Record Time should be " + Util.DATE_FORMAT);
            }
        }

        if (json.has("goToBedOnTime")) {
            try {
                doc.append("goToBedOnTime", json.getBoolean("goToBedOnTime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid goToBedOnTime Value!");
            }
        }

        if (json.has("wakeUpOnTime")) {
            try {
                doc.append("wakeUpOnTime", json.getBoolean("wakeUpOnTime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid wakeUpOnTime Value!");
            }
        }

        if (json.has("hoursOfSleep")) {
            int hoursOfSleep = 8;
            try {
                hoursOfSleep = json.getInt("hoursOfSleep");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Hours of Sleep Type!");
            }

            if (hoursOfSleep < 0) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Hours of Sleep must be more than 0!");
            } else {
                doc.append("hoursOfSleep", hoursOfSleep);
            }
        }

        if (json.has("haveExercise")) {
            try {
                doc.append("haveExercise", json.getBoolean("haveExercise"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Exercise Value!");
            }
        }

        if (json.has("threeMeals")) {
            try {
                List<String> threeMealsList = new ArrayList<String>();
                JSONArray threeMealsArray = json.getJSONArray("threeMeals");
                for (int i = 0; i < threeMealsArray.length(); i++) {
                    threeMealsList.add(threeMealsArray.getString(i));
                }
                doc.append("threeMeals", threeMealsList);
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Three Meals Content!");
            }
        }

        if (json.has("weight")) {
            double weight = 0.00;
            try {
                weight = json.getDouble("weight");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Weight Type!");
            }

            if (weight < 0) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Weight must be more than 0!");
            } else {
                doc.append("weight", weight);
            }
        }

        if (json.has("moodDiary")) {
            try {
                doc.append("moodDiary", json.getString("moodDiary"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Mood Diary!");
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
            // Make sure this health record belongs to the user.
            APPResponse response = getOne(headers, id);
            Health health = (Health) response.content;
            Util.checkAuthentication(headers, health.getUserId());
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
                    "Could not delete health record " + id);
        }
        return new APPResponse();
    }
}
