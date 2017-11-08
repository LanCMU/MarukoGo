package main.models;

import java.util.List;

public class Note {
    String id = null;
    String userId;
    String noteCaption;
    List<String> noteContent;
    int noteType;
    boolean isPinned;
    String remindTime;

    public Note(String userId, String noteCaption, List<String> noteContent,
                int noteType, boolean isPinned, String remindTime) {
        this.userId = userId;
        this.noteCaption = noteCaption;
        this.noteContent = noteContent;
        this.noteType = noteType;
        this.isPinned = isPinned;
        this.remindTime = remindTime;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
}