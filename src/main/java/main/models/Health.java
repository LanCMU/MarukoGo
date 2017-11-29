package main.models;

import java.util.List;

public class Health {
    String id = null;
    String userId;
    String recordTime;
    boolean goToBedOnTime;
    boolean wakeUpOnTime;
    int hoursOfSleep;
    boolean haveExercise;
    List<String> threeMeals;
    double weight;
    String moodDiary;

    public Health(String userId, String recordTime, boolean goToBedOnTime,
                  boolean wakeUpOnTime, int hoursOfSleep, boolean haveExercise,
                  List<String> threeMeals, double weight, String moodDiary) {
        this.userId = userId;
        this.recordTime = recordTime;
        this.goToBedOnTime = goToBedOnTime;
        this.wakeUpOnTime = wakeUpOnTime;
        this.hoursOfSleep = hoursOfSleep;
        this.haveExercise = haveExercise;
        this.threeMeals = threeMeals;
        this.weight = weight;
        this.moodDiary = moodDiary;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
}


