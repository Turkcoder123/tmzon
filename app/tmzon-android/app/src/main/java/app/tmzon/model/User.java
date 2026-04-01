package app.tmzon.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class User {
    @SerializedName("_id") public String id;
    public String username;
    public String email;
    public String bio;
    public String avatar;
    public List<String> followers;
    public List<String> following;
}
