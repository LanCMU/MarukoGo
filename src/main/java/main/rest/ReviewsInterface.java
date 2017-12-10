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
import main.models.Review;
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

@Path("reviews")
public class ReviewsInterface {
    private MongoCollection<Document> collection = null;
    private ObjectWriter ow;

    public ReviewsInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        collection = database.getCollection("reviews");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON})
    public APPResponse getAll(@DefaultValue("_id") @QueryParam("sort") String sortArg) {

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
            FindIterable<Document> results = collection.find().sort(sortParams);
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
            return new APPResponse(reviewList);

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
                        "No such review " + id);
            }
            Review review = new Review(
                    item.getString("userId"),
                    item.getInteger("reviewCategory"),
                    item.getString("title"),
                    item.getString("reviewContent"),
                    item.getInteger("rating"),
                    Util.getStringFromDate(item, "finishTime")
            );
            review.setId(item.getObjectId("_id").toString());

            // Make sure this review belongs to the user.
            Util.checkAuthentication(headers, review.getUserId());

            return new APPResponse(review);

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
            // Make sure this review belongs to the user.
            APPResponse response = getOne(headers, id);
            Review review = (Review) response.content;
            Util.checkAuthentication(headers, review.getUserId());
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

        // Review Category is required, and its value should be 0(Movie), 1(Book), 2(Music), or 3(Others).
        // Its default value is 0 (Movie).
        if (json.has("reviewCategory")) {
            int reviewCategory = 0;
            try {
                reviewCategory = json.getInt("reviewCategory");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Review Category!");
            }

            if (reviewCategory != 0 && reviewCategory != 1 && reviewCategory != 2 && reviewCategory != 3) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Review Category must be Movie, Book, Music, or Others!");
            } else {
                doc.append("reviewCategory", reviewCategory);
            }
        }
        if (json.has("title")) {
            try {
                doc.append("title", json.getString("title"));
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Title!");
            }
        }
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
        if (json.has("rating")) {
            int rating = 3;
            try {
                rating = json.getInt("rating");
            } catch (JSONException e) {
                throw new APPBadRequestException(ErrorCode.BAD_REQUEST.getErrorCode(),
                        "Invalid Rating!");
            }

            if (rating != 1 && rating != 2 && rating != 3 && rating != 4 && rating != 5) {
                throw new APPBadRequestException(ErrorCode.INVALID_VALUES.getErrorCode(),
                        "Rating must be the value between 1(lowest) to 5(highest)!");
            } else {
                doc.append("rating", rating);
            }
        }
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
            // Make sure this review belongs to the user.
            APPResponse response = getOne(headers, id);
            Review review = (Review) response.content;
            Util.checkAuthentication(headers, review.getUserId());
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
                    "Could not delete review " + id);
        }
        return new APPResponse();
    }
}
