package main.models;

public class SharedReview {
    String firstName;
    String reviewCategory;
    String title;
    String reviewContent;
    String rating;
    String finishTime;

    public SharedReview(String firstName, String reviewCategory, String title, String reviewContent,
                        String rating, String finishTime) {
        this.firstName = firstName;
        this.reviewCategory = reviewCategory;
        this.title = title;
        this.reviewContent = reviewContent;
        this.rating = rating;
        this.finishTime = finishTime;
    }
}
