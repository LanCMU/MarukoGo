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

    private ObjectWriter ow;


    public UsersInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");

        this.collection = database.getCollection("users");
        this.calendarCollection = database.getCollection("calendars");
        this.noteCollection = database.getCollection("notes");
        this.healthCollection = database.getCollection("healths");
        this.todoCollection = database.getCollection("todos");
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
                                             @DefaultValue("0") @QueryParam("offset") int offset) {

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

        // share Id
        if (json.has("shareId")) {
            throw new APPBadRequestException(ErrorCode.MISSING_PROPERTIES.getErrorCode(),
                    "You should not pass Share Id!");
        }

        Document docShare = new Document("shareId", id);

        // Todos' category is optional.
        if (json.has("todoCategory")) {
            try {
                List<String> todoCategoryList = new ArrayList<String>();
                JSONArray todoCategoryArray = json.getJSONArray("todoCategory");
                for (int i = 0; i < todoCategoryArray.length(); i++) {
                    todoCategoryList.add(todoCategoryArray.getString(i));
                }
                doc.append("todoCategory", todoCategoryList);
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

        DeleteResult deleteResult;
        try {
            deleteResult = collection.deleteOne(query);

            // Deletes all the notes owned by the user.
            noteCollection.deleteMany(noteQuery);

            // Deletes all the calendars owned by the user.
            calendarCollection.deleteMany(calendarQuery);

            // Deletes all the healths owned by the user.
            healthCollection.deleteMany(healthQuery);

            // Deletes all the todos owned by the user.
            todoCollection.deleteMany(todoQuery);
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
