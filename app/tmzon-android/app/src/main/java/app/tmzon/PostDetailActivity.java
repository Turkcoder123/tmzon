package app.tmzon;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ActivityPostDetailBinding;
import app.tmzon.model.Comment;
import app.tmzon.model.Post;
import app.tmzon.util.SessionManager;
import com.bumptech.glide.Glide;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PostDetailActivity extends AppCompatActivity {
    private ActivityPostDetailBinding binding;
    private SessionManager sessionManager;
    private String postId;
    private Post currentPost;
    private CommentAdapter commentAdapter;
    private List<Comment> comments;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityPostDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbar);
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        sessionManager = new SessionManager(this);
        postId = getIntent().getStringExtra("post_id");
        comments = new ArrayList<>();
        commentAdapter = new CommentAdapter(this, comments, postId);
        binding.rvComments.setLayoutManager(new LinearLayoutManager(this));
        binding.rvComments.setAdapter(commentAdapter);

        if (!sessionManager.isLoggedIn()) {
            binding.commentInputLayout.setVisibility(View.GONE);
        }

        binding.btnSendComment.setOnClickListener(v -> sendComment());

        loadPost();
    }

    private void loadPost() {
        ApiClient.getService(this).getAllPosts().enqueue(new Callback<List<Post>>() {
            @Override
            public void onResponse(Call<List<Post>> call, Response<List<Post>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    for (Post p : response.body()) {
                        if (p.id.equals(postId)) {
                            currentPost = p;
                            bindPost(p);
                            break;
                        }
                    }
                }
            }
            @Override
            public void onFailure(Call<List<Post>> call, Throwable t) {}
        });
    }

    private void bindPost(Post post) {
        if (post.author != null) {
            binding.tvUsername.setText(post.author.username);
            if (post.author.avatar != null && !post.author.avatar.isEmpty()) {
                Glide.with(this).load(post.author.avatar).centerCrop().into(binding.ivAvatar);
            }
        }
        binding.tvContent.setText(post.content);

        int likeCount = post.likes != null ? post.likes.size() : 0;
        binding.tvLikeCount.setText(String.valueOf(likeCount));

        String currentUserId = sessionManager.getUserId();
        boolean isLiked = post.likes != null && currentUserId != null && post.likes.contains(currentUserId);
        binding.btnLike.setImageResource(isLiked ? android.R.drawable.btn_star_big_on : android.R.drawable.btn_star_big_off);

        binding.btnLike.setOnClickListener(v -> toggleLike());

        if (post.comments != null) {
            comments.clear();
            comments.addAll(post.comments);
            commentAdapter.notifyDataSetChanged();
        }
    }

    private void toggleLike() {
        ApiClient.getService(this).toggleLike(postId).enqueue(new Callback<Post>() {
            @Override
            public void onResponse(Call<Post> call, Response<Post> response) {
                if (response.isSuccessful() && response.body() != null) {
                    currentPost = response.body();
                    bindPost(currentPost);
                }
            }
            @Override
            public void onFailure(Call<Post> call, Throwable t) {}
        });
    }

    private void sendComment() {
        String content = binding.etComment.getText() != null ? binding.etComment.getText().toString().trim() : "";
        if (content.isEmpty()) {
            binding.tilComment.setError("Yorum boş olamaz");
            return;
        }
        binding.tilComment.setError(null);
        binding.btnSendComment.setEnabled(false);

        Map<String, String> body = new HashMap<>();
        body.put("content", content);

        ApiClient.getService(this).addComment(postId, body).enqueue(new Callback<Comment>() {
            @Override
            public void onResponse(Call<Comment> call, Response<Comment> response) {
                binding.btnSendComment.setEnabled(true);
                if (response.isSuccessful() && response.body() != null) {
                    binding.etComment.setText("");
                    comments.add(response.body());
                    commentAdapter.notifyItemInserted(comments.size() - 1);
                    binding.rvComments.scrollToPosition(comments.size() - 1);
                } else {
                    Toast.makeText(PostDetailActivity.this, "Yorum gönderilemedi", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<Comment> call, Throwable t) {
                binding.btnSendComment.setEnabled(true);
                Toast.makeText(PostDetailActivity.this, "Bağlantı hatası", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
