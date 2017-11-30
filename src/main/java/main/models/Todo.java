package main.models;

public class Todo {
    String id = null;
    String userId;
    String todoCategory;
    String todoContent;
    boolean isImportant;
    String dueDate;
    boolean isFinished;

    public Todo(String userId, String todoCategory, String todoContent,
                boolean isImportant, String dueDate, boolean isFinished) {
        this.userId = userId;
        this.todoCategory = todoCategory;
        this.todoContent = todoContent;
        this.isImportant = isImportant;
        this.dueDate = dueDate;
        this.isFinished = isFinished;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
}
