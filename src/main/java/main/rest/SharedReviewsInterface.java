package main.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.mongodb.BasicDBObject;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import main.exceptions.*;
import main.helpers.APPCrypt;
import main.helpers.APPResponse;
import main.helpers.Util;
import main.models.SharedReview;
import org.bson.Document;
import org.bson.types.ObjectId;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;

@Path("shared_reviews")
public class SharedReviewsInterface {
    private MongoCollection<Document> userCollection;
    private MongoCollection<Document> reviewCollection;
    private ObjectWriter ow;

    public SharedReviewsInterface() {
        MongoClient mongoClient = new MongoClient();
        MongoDatabase database = mongoClient.getDatabase("maruko");
        this.userCollection = database.getCollection("users");
        this.reviewCollection = database.getCollection("reviews");
        ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
    }


    @GET
    @Path("get_share_id/{id}")
    @Produces({MediaType.APPLICATION_JSON})
    // Encrypt review ID, and use it as part of the link to share the review.
    public APPResponse getShareId(@Context HttpHeaders headers, @PathParam("id") String id) {
        try {
            String shareId = APPCrypt.encrypt(id);
            return new APPResponse(shareId);
        } catch (Exception e) {
            throw new APPInternalServerException(ErrorCode.INTERNAL_SERVER_ERROR.getErrorCode(),
                    "Internal Server Error!");
        }
    }

    @GET
    @Path("{share_id}")
    @Produces({MediaType.APPLICATION_JSON})
    public SharedReview getSharedReview(@Context HttpHeaders headers, @PathParam("share_id") String shareId) {
        try {
            String reviewId = APPCrypt.decrypt(shareId);

            BasicDBObject reviewQuery = new BasicDBObject();
            reviewQuery.put("_id", new ObjectId(reviewId));
            Document reviewItem = reviewCollection.find(reviewQuery).first();
            if (reviewItem == null) {
                throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                        "No such review " + reviewId);
            }

            BasicDBObject userQuery = new BasicDBObject();
            String userId = reviewItem.getString("userId");
            userQuery.put("_id", new ObjectId(userId));
            Document userItem = userCollection.find(userQuery).first();
            if (userItem == null) {
                throw new APPNotFoundException(ErrorCode.NOT_FOUND.getErrorCode(),
                        "No such user " + userId);
            }

            String reviewCategory = "";
            switch (reviewItem.getInteger("reviewCategory")) {
                case 0:
                    reviewCategory = "Movie";
                    break;
                case 1:
                    reviewCategory = "Book";
                    break;
                case 2:
                    reviewCategory = "Music";
                    break;
                case 3:
                    reviewCategory = "Others";
                    break;
            }

            String rating = "";
            switch (reviewItem.getInteger("rating")) {
                case 1:
                    rating = "1 Star";
                    break;
                case 2:
                    rating = "2 Stars";
                    break;
                case 3:
                    rating = "3 Stars";
                    break;
                case 4:
                    rating = "4 Stars";
                    break;
                case 5:
                    rating = "5 Stars";
                    break;
            }

            SharedReview sharedReview = new SharedReview(
                    userItem.getString("firstName"),
                    reviewCategory,
                    reviewItem.getString("title"),
                    reviewItem.getString("reviewContent"),
                    rating,
                    Util.getStringFromDate(reviewItem, "finishTime")
            );

            return sharedReview;
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
}
