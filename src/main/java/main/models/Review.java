package main.models;

public class Review {
    String id = null;
    String userId;
    int reviewCategory;
    String title;
    String reviewContent;
    int rating;
    String finishTime;

    public Review(String userId, int reviewCategory, String title, String reviewContent,
                  int rating, String finishTime) {
        this.userId = userId;
        this.reviewCategory = reviewCategory;
        this.title = title;
        this.reviewContent = reviewContent;
        this.rating = rating;
        this.finishTime = finishTime;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
}
