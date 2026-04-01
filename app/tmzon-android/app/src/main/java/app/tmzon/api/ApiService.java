package app.tmzon.api;

import app.tmzon.model.AuthResponse;
import app.tmzon.model.Comment;
import app.tmzon.model.Post;
import app.tmzon.model.User;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Path;

public interface ApiService {
    @POST("api/auth/login")
    Call<AuthResponse> login(@Body Map<String, String> body);

    @POST("api/auth/register")
    Call<AuthResponse> register(@Body Map<String, String> body);

    @GET("api/users/me")
    Call<User> getMe();

    @PUT("api/users/me")
    Call<User> updateMe(@Body Map<String, String> body);

    @GET("api/users/{username}")
    Call<User> getUser(@Path("username") String username);

    @POST("api/users/{username}/follow")
    Call<User> toggleFollow(@Path("username") String username);

    @GET("api/posts")
    Call<List<Post>> getAllPosts();

    @GET("api/posts/feed")
    Call<List<Post>> getFeedPosts();

    @GET("api/posts/user/{username}")
    Call<List<Post>> getUserPosts(@Path("username") String username);

    @POST("api/posts")
    Call<Post> createPost(@Body Map<String, String> body);

    @DELETE("api/posts/{id}")
    Call<Void> deletePost(@Path("id") String id);

    @POST("api/posts/{id}/like")
    Call<Post> toggleLike(@Path("id") String id);

    @POST("api/posts/{id}/comments")
    Call<Comment> addComment(@Path("id") String postId, @Body Map<String, String> body);

    @DELETE("api/posts/{postId}/comments/{commentId}")
    Call<Void> deleteComment(@Path("postId") String postId, @Path("commentId") String commentId);
}
