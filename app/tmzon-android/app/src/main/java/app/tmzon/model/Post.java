package app.tmzon.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class Post {
    @SerializedName("_id") public String id;
    public String content;
    public User author;
    public List<String> likes;
    public List<Comment> comments;
    public String createdAt;
}
