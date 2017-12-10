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
import main.helpers.*;
import main.models.*;
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


@Path("users")
public class UsersInterface {

    private MongoCollection<Document> collection;
    private MongoCollection<Document> calendarCollection;
    private MongoCollection<Document> noteCollection;
    private MongoCollection<Document> healthCollection;
    private MongoCollection<Document> todoCollection;
    private MongoCollection<Document> reviewCollection;

    private ObjectWriter ow;


    public UsersInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");

        this.collection = database.getCollection("users");
        this.calendarCollection = database.getCollection("calendars");
        this.noteCollection = database.getCollection("notes");
        this.healthCollection = database.getCollection("healths");
        this.todoCollection = database.getCollection("todos");
        this.reviewCollection = database.getCollection("reviews");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll() {

        ArrayList<User> userList = new ArrayList<User>();

        try {
            FindIterable<Document> results = collection.find();
            if (results == null) {
                return new APPResponse(userList);
            }
            for (Document item : results) {
                User user = new User(
                        item.getString("firstName"),
                        item.getString("lastName"),
                        item.getString("userName"),
                        item.getString("phoneNumber"),
                        item.getString("emailAddress"),
                        item.getString("profilePhotoURL"),
                        item.getBoolean("isPrime")
                );
                user.setId(item.getObjectId("_id").toString());
                userList.add(user);
            }
            return new APPResponse(userList);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}")
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getOne(@Context HttpHeaders headers, @PathParam("id") String id) {
        try {
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("_id", new ObjectId(id));
            Document item = collection.find(query).first();
            if (item == null) {
                throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                        "No such user " + id);
            }
            User user = new User(
                    item.getString("firstName"),
                    item.getString("lastName"),
                    item.getString("userName"),
                    item.getString("phoneNumber"),
                    item.getString("emailAddress"),
                    item.getString("profilePhotoURL"),
                    item.getBoolean("isPrime")
            );
            user.setId(item.getObjectId("_id").toString());
            return new APPResponse(user);

        } catch (APPNotFoundException | APPUnauthorizedException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            throw new APPBadRequestException(ErrorCode.INVALID_MONGO_ID.getErrorCode(),
                    "Invalid MongoDB ID!");
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}/notes")
    @Produces({MediaType.APPLICATION_JSON})
    public APPListResponse getNotesForUser(@Context HttpHeaders headers, @PathParam("id") String id,
                                           @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                           @DefaultValue("20") @QueryParam("count") int count,
                                           @DefaultValue("0") @QueryParam("offset") int offset) {

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
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("userId", id);

            long resultCount = noteCollection.count(query);
            FindIterable<Document> results = noteCollection.find(query).sort(sortParams).skip(offset).limit(count);
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
            return new APPListResponse(noteList, resultCount, offset, noteList.size());
        } catch (APPBadRequestException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}/healths")
    @Produces({MediaType.APPLICATION_JSON})
    public APPListResponse getHealthsForUser(@Context HttpHeaders headers, @PathParam("id") String id,
                                             @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                             @DefaultValue("20") @QueryParam("count") int count,
                                             @DefaultValue("0") @QueryParam("offset") int offset) {

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
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("userId", id);

            long resultCount = healthCollection.count(query);
            FindIterable<Document> results = healthCollection.find(query).sort(sortParams).skip(offset).limit(count);
            for (Document item : results) {
                Health health = new Health(
                        item.getString("userId"),
                        Util.getStringFromDate(item, "recordTime"),
                        item.getBoolean("goToBedOnTime"),
                        item.getBoolean("wakeUpOnTime"),
                        item.getInteger("hoursOfSleep"),
                        item.getBoolean("haveExercise"),
                        (List<String>) item.get("threeMeals"),
                        ((Number) item.get("weight")).doubleValue(),
                        item.getString("moodDiary")
                );
                health.setId(item.getObjectId("_id").toString());
                healthList.add(health);
            }
            return new APPListResponse(healthList, resultCount, offset, healthList.size());
        } catch (APPBadRequestException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}/todos")
    @Produces({MediaType.APPLICATION_JSON})
    public APPListResponse getTodosForUser(@Context HttpHeaders headers, @PathParam("id") String id,
                                           @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                           @DefaultValue("20") @QueryParam("count") int count,
                                           @DefaultValue("0") @QueryParam("offset") int offset,
                                           @DefaultValue("all") @QueryParam("finished") String isFinished) {

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
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("userId", id);

            if (isFinished.compareTo("true") == 0) {
                query.put("isFinished", true);
            } else if (isFinished.compareTo("false") == 0) {
                query.put("isFinished", false);
            }

            long resultCount = todoCollection.count(query);
            FindIterable<Document> results = todoCollection.find(query).sort(sortParams).skip(offset).limit(count);
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
            return new APPListResponse(todoList, resultCount, offset, todoList.size());
        } catch (APPBadRequestException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}/reviews")
    @Produces({MediaType.APPLICATION_JSON})
    public APPListResponse getReviewsForUser(@Context HttpHeaders headers, @PathParam("id") String id,
                                             @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                             @DefaultValue("2") @QueryParam("count") int count,
                                             @DefaultValue("0") @QueryParam("offset") int offset) {

        ArrayList<Review> reviewList = new ArrayList<Review>();

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
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("userId", id);

            long resultCount = reviewCollection.count(query);
            FindIterable<Document> results = reviewCollection.find(query).sort(sortParams).skip(offset).limit(count);

            for (Document item : results) {
                Review review = new Review(
                        item.getString("userId"),
                        item.getInteger("reviewCategory"),
                        item.getString("title"),
                        item.getString("reviewContent"),
                        item.getInteger("rating"),
                        Util.getStringFromDate(item, "finishTime")
                );
                review.setId(item.getObjectId("_id").toString());
                reviewList.add(review);
            }
            return new APPListResponse(reviewList, resultCount, offset, reviewList.size());
        } catch (APPBadRequestException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{id}/calendars")
    @Produces({MediaType.APPLICATION_JSON})
    public APPListResponse getCalendarsForUser(@Context HttpHeaders headers, @PathParam("id") String id,

                                               @DefaultValue("_id") @QueryParam("sort") String sortArg,
                                               @DefaultValue("20") @QueryParam("count") int count,
                                               @DefaultValue("0") @QueryParam("offset") int offset) {

        ArrayList<Calendar> calendarList = new ArrayList<Calendar>();

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
            Util.checkAuthentication(headers, id);
            BasicDBObject query = new BasicDBObject();
            query.put("userId", id);

            long resultCount = calendarCollection.count(query);
            FindIterable<Document> results = calendarCollection.find(query).sort(sortParams).skip(offset).limit(count);
            for (Document item : results) {
                Calendar calendar = new Calendar(
                        item.getString("calendarName"),
                        item.getString("discription"),
                        item.getString("userId")
                );
                calendar.setId(item.getObjectId("_id").toString());
                calendarList.add(calendar);
            }
            return new APPListResponse(calendarList, resultCount, offset, calendarList.size());
        } catch (APPBadRequestException e) {
            throw e;
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse create(Object request) {
        JSONObject json = null;
        try {
            json = new JSONObject(ow.writeValueAsString(request));
        } catch (JsonProcessingException e) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(), e.getMessage());
        }

        Document doc = new Document();

        // First name is required.
        if (json.has("firstName")) {
            try {
                doc.append("firstName", json.getString("firstName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid First Name!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing First Name!");
        }

        // Last name is required.
        if (json.has("lastName")) {
            try {
                doc.append("lastName", json.getString("lastName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Last Name!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Last Name!");
        }

        // User name is required.
        if (json.has("userName")) {
            try {
                doc.append("userName", json.getString("userName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid User Name!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing User Name!");
        }

        // Phone number is optional.
        if (json.has("phoneNumber")) {
            try {
                doc.append("phoneNumber", json.getString("phoneNumber"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Phone Number!");
            }
        }

        // Email address is required.
        if (json.has("emailAddress")) {
            try {
                doc.append("emailAddress", json.getString("emailAddress"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Email Address!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Email Address!");
        }

        // Password is required.
        if (json.has("password")) {
            try {
                doc.append("password", APPCrypt.encrypt(json.getString("password")));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Password!");
            } catch (Exception e) {
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Internal Server Error!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Password!");
        }

        // Profile photo is optional.
        if (json.has("profilePhotoURL")) {
            try {
                doc.append("profilePhotoURL", json.getString("profilePhotoURL"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Profile Photo!");
            }
        }

        // Whether the user is prime or not.
        if (json.has("isPrime")) {
            try {
                doc.append("isPrime", json.getBoolean("isPrime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isPrime!");
            }
        }

        // Verify that the user name is not used.
        BasicDBObject userQuery = new BasicDBObject();
        userQuery.put("userName", json.getString("userName"));
        Document userItem = collection.find(userQuery).first();
        if (userItem != null) {
            throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                    "The username is already taken!");
        }

        try {
            collection.insertOne(doc);
            return new APPResponse();
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Path("{id}/notes")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse createNote(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            Util.checkAuthentication(headers, id);
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

        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass User Id!");
        }

        Document doc = new Document("userId", id);

        // Note caption is required.
        if (json.has("noteCaption")) {
            try {
                doc.append("noteCaption", json.getString("noteCaption"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Note Caption!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Note Caption!");
        }

        // Note content is optional.
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

        // Note type is optional, and its value should be 0 (memo) or 1 (checklist).
        // Its default value is 0 (memo).
        int noteType = 0;
        if (json.has("noteType")) {
            try {
                noteType = json.getInt("noteType");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Note Type!");
            }
        }
        if (noteType != 0 && noteType != 1) {
            throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                    "Note Type must be 0 or 1!");
        } else {
            doc.append("noteType", noteType);
        }

        // isPinned is optional. Default value is false (not pinned).
        boolean isPinned = false;
        if (json.has("isPinned")) {
            try {
                isPinned = json.getBoolean("isPinned");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isPinned Value!");
            }
        }
        doc.append("isPinned", isPinned);

        // Remind time is optional.
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
            noteCollection.insertOne(doc);
            Note note = new Note(
                    doc.getString("userId"),
                    doc.getString("noteCaption"),
                    (List<String>) doc.get("noteContent"),
                    doc.getInteger("noteType"),
                    doc.getBoolean("isPinned"),
                    Util.getStringFromDate(doc, "remindTime")
            );
            note.setId(doc.getObjectId("_id").toString());
            return new APPResponse(note);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Path("{id}/healths")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse createHealth(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            Util.checkAuthentication(headers, id);
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

        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass User Id!");
        }

        Document doc = new Document("userId", id);

        // Record time is required.
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
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Record Time!");
        }

        // goToBedOnTime is optional. Default value is true (go to bed on time).
        boolean goToBedOnTime = true;
        if (json.has("goToBedOnTime")) {
            try {
                goToBedOnTime = json.getBoolean("goToBedOnTime");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid goToBedOnTime Value!");
            }
        }
        doc.append("goToBedOnTime", goToBedOnTime);

        // wakeUpOnTime is optional. Default value is true (wake up on time).
        boolean wakeUpOnTime = true;
        if (json.has("wakeUpOnTime")) {
            try {
                wakeUpOnTime = json.getBoolean("wakeUpOnTime");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid wakeUpOnTime Value!");
            }
        }
        doc.append("wakeUpOnTime", wakeUpOnTime);


        // hoursOfSleep is optional, and its value should be more than 0.
        // Its default value is 8 hours.
        int hoursOfSleep = 8;
        if (json.has("hoursOfSleep")) {
            try {
                hoursOfSleep = json.getInt("hoursOfSleep");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid hoursOfSleep!");
            }
        }
        if (hoursOfSleep < 0) {
            throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                    "Hours of Sleep must be more than 0!");
        } else {
            doc.append("hoursOfSleep", hoursOfSleep);
        }

        // haveExercise is optional. Default value is true (have exercise).
        boolean haveExercise = true;
        if (json.has("haveExercise")) {
            try {
                haveExercise = json.getBoolean("haveExercise");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid haveExercise Value!");
            }
        }
        doc.append("haveExercise", haveExercise);

        // Three Meals is optional.
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
                        "Invalid Three Meals!");
            }
        }

        // Weight is optional, and its value should be more than 0.
        // Its default value is 0.
        double weight = 0.00;
        if (json.has("weight")) {
            try {
                weight = json.getDouble("weight");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Weight!");
            }
        }
        if (weight < 0) {
            throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                    "Weight must be more than 0!");
        } else {
            doc.append("weight", weight);
        }

        // moodDiary is optional.
        if (json.has("moodDiary")) {
            try {
                doc.append("moodDiary", json.getString("moodDiary"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Mood Diary!");
            }
        }

        try {
            healthCollection.insertOne(doc);
            Health health = new Health(
                    doc.getString("userId"),
                    Util.getStringFromDate(doc, "recordTime"),
                    doc.getBoolean("goToBedOnTime"),
                    doc.getBoolean("wakeUpOnTime"),
                    doc.getInteger("hoursOfSleep"),
                    doc.getBoolean("haveExercise"),
                    (List<String>) doc.get("threeMeals"),
                    ((Number) doc.get("weight")).doubleValue(),
                    doc.getString("moodDiary")
            );
            health.setId(doc.getObjectId("_id").toString());
            return new APPResponse(health);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Path("{id}/todos")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse createTodo(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            Util.checkAuthentication(headers, id);
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

        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass User Id!");
        }

        Document doc = new Document("userId", id);

        // Todos' category is optional.
        if (json.has("todoCategory")) {
            try {
                doc.append("todoCategory", json.getString("todoCategory"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Todo Category!");
            }
        }

        // Todos' Content is required.
        if (json.has("todoContent")) {
            try {
                doc.append("todoContent", json.getString("todoContent"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Todo Content!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Todo Content!");
        }

        // isImportant is optional. Default value is false (not important).
        boolean isImportant = false;
        if (json.has("isImportant")) {
            try {
                isImportant = json.getBoolean("isImportant");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isImportant Value!");
            }
        }
        doc.append("isImportant", isImportant);

        // Due date is required.
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
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Due Date!");
        }

        // isFinished is optional. Default value is false (haven't finished).
        boolean isFinished = false;
        if (json.has("isFinished")) {
            try {
                isFinished = json.getBoolean("isFinished");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid isFinished Value!");
            }
        }
        doc.append("isFinished", isFinished);

        try {
            todoCollection.insertOne(doc);
            Todo todo = new Todo(
                    doc.getString("userId"),
                    doc.getString("todoCategory"),
                    doc.getString("todoContent"),
                    doc.getBoolean("isImportant"),
                    Util.getStringFromDate(doc, "dueDate"),
                    doc.getBoolean("isFinished")
            );
            todo.setId(doc.getObjectId("_id").toString());
            return new APPResponse(todo);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Path("{id}/reviews")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse createReview(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            Util.checkAuthentication(headers, id);
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

        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass User Id!");
        }

        Document doc = new Document("userId", id);

        // Review Category is required, and its value should be 0(Movie), 1(Book), 2(Music), or 3(Others).
        // Its default value is 0 (Movie).
        int reviewCategory = 0;
        if (json.has("reviewCategory")) {
            try {
                reviewCategory = json.getInt("reviewCategory");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Review Category!");
            }
        }
        if (reviewCategory != 0 && reviewCategory != 1 && reviewCategory != 2 && reviewCategory != 3) {
            throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                    "Review Category must be 0(Movie), 1(Book), 2(Music), or 3(Others)!");
        } else {
            doc.append("reviewCategory", reviewCategory);
        }

        // Title is required.
        if (json.has("title")) {
            try {
                doc.append("title", json.getString("title"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Title!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing Title!");
        }

        // Review Content is optional.
        if (json.has("reviewContent")) {
            try {
                doc.append("reviewContent", json.getString("reviewContent"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Review Content!");
            }
        }

        // Rating is optional, and its value should be 1(Very Bad), 2(Bad), 3(Average), 4(Good), or 5(Very Good).
        // Its default value is 3(Stars).
        int rating = 0;
        if (json.has("rating")) {
            try {
                rating = json.getInt("rating");
                if (rating < 1 || rating > 5) {
                    throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                            "Rating must be the value between 1(lowest) to 5(highest)!");
                }
                doc.append("rating", json.getInt("rating"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Rating!");
            } catch (APPBadRequestException e) {
                throw e;
            }
        }


        // Finish Time is optional.
        if (json.has("finishTime")) {
            try {
                doc.append("finishTime", Util.getDateFromString(json, "finishTime"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Finish Time!");
            } catch (ParseException e) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Finish Time should be " + Util.DATE_FORMAT);
            }
        }

        try {
            reviewCollection.insertOne(doc);
            Review review = new Review(
                    doc.getString("userId"),
                    doc.getInteger("reviewCategory"),
                    doc.getString("title"),
                    doc.getString("reviewContent"),
                    doc.getInteger("rating"),
                    Util.getStringFromDate(doc, "finishTime")
            );
            review.setId(doc.getObjectId("_id").toString());
            return new APPResponse(review);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @POST
    @Path("{id}/calendars")
    @Consumes({MediaType.APPLICATION_JSON})
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse createCalendar(@Context HttpHeaders headers, @PathParam("id") String id, Object request) {
        try {
            Util.checkAuthentication(headers, id);
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

        if (json.has("userId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass User Id!");
        }

        Document doc = new Document("userId", id);

        // Calendar name is required.
        if (json.has("calendarName")) {
            try {
                doc.append("calendarName", json.getString("calendarName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid calendar name!");
            }
        } else {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "Missing calendar name!");
        }

        // Calendar description is optional.
        if (json.has("description")) {
            try {
                doc.append("description", json.getString("description"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Discription!");
            }
        }

        try {
            calendarCollection.insertOne(doc);
            Calendar calendar = new Calendar(doc.getString("calendarName"),
                    doc.getString("description"),
                    doc.getString("userId"));
            calendar.setId(doc.getObjectId("_id").toString());
            return new APPResponse(calendar);
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
            Util.checkAuthentication(headers, id);
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
        if (json.has("firstName")) {
            try {
                doc.append("firstName", json.getString("firstName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid First Name!");
            }
        }
        if (json.has("lastName")) {
            try {
                doc.append("lastName", json.getString("lastName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Last Name!");
            }
        }
        if (json.has("userName")) {
            try {
                doc.append("userName", json.getString("userName"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid User Name!");
            }
        }
        if (json.has("phoneNumber")) {
            try {
                doc.append("phoneNumber", json.getString("phoneNumber"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Phone Number!");
            }
        }
        if (json.has("emailAddress")) {
            try {
                doc.append("emailAddress", json.getString("emailAddress"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Email Address!");
            }
        }
        if (json.has("password")) {
            try {
                doc.append("password", APPCrypt.encrypt(json.getString("password")));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Password!");
            } catch (Exception e) {
                throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                        "Internal Server Error!");
            }
        }
        if (json.has("profilePhotoURL")) {
            try {
                doc.append("profilePhotoURL", json.getString("profilePhotoURL"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Profile Photo!");
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
            Util.checkAuthentication(headers, id);
        } catch (APPUnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        BasicDBObject query = new BasicDBObject();
        query.put("_id", new ObjectId(id));
        BasicDBObject noteQuery = new BasicDBObject();
        noteQuery.put("userId", id);
        BasicDBObject calendarQuery = new BasicDBObject();
        calendarQuery.put("userId", id);
        BasicDBObject healthQuery = new BasicDBObject();
        healthQuery.put("userId", id);
        BasicDBObject todoQuery = new BasicDBObject();
        todoQuery.put("userId", id);
        BasicDBObject reviewQuery = new BasicDBObject();
        reviewQuery.put("userId", id);

        DeleteResult deleteResult;
        try {
            deleteResult = collection.deleteOne(query);


            // Deletes all the calendars owned by the user.
            calendarCollection.deleteMany(calendarQuery);

            // Deletes all the healths owned by the user.
            healthCollection.deleteMany(healthQuery);

            // Deletes all the notes owned by the user.
            noteCollection.deleteMany(noteQuery);

            // Deletes all the todos owned by the user.
            todoCollection.deleteMany(todoQuery);

            // Deletes all the reviews owned by the user.
            reviewCollection.deleteMany(reviewQuery);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }

        if (deleteResult.getDeletedCount() < 1) {
            throw new APPNotFoundException(ErrorCode.COULD_NOT_DELETE.getErrorCode(),
                    "Could not delete user " + id);
        }
        return new APPResponse();
    }
}
