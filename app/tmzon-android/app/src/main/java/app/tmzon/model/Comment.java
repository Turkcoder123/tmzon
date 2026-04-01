package app.tmzon.model;

import com.google.gson.annotations.SerializedName;

public class Comment {
    @SerializedName("_id") public String id;
    public String content;
    public User author;
    public String createdAt;
}
