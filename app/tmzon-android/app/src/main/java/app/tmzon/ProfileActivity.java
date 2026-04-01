package app.tmzon;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ActivityProfileBinding;
import app.tmzon.model.Post;
import app.tmzon.model.User;
import app.tmzon.util.SessionManager;
import com.bumptech.glide.Glide;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {
    private ActivityProfileBinding binding;
    private SessionManager sessionManager;
    private String username;
    private User profileUser;
    private PostAdapter postAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityProfileBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbar);
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        sessionManager = new SessionManager(this);
        username = getIntent().getStringExtra("username");

        postAdapter = new PostAdapter(this, new ArrayList<>());
        binding.rvPosts.setLayoutManager(new LinearLayoutManager(this));
        binding.rvPosts.setAdapter(postAdapter);

        loadProfile();
    }

    private void loadProfile() {
        binding.progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getUser(username).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                binding.progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    profileUser = response.body();
                    bindProfile(profileUser);
                    loadUserPosts();
                }
            }
            @Override
            public void onFailure(Call<User> call, Throwable t) {
                binding.progressBar.setVisibility(View.GONE);
                Toast.makeText(ProfileActivity.this, "Profil yüklenemedi", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void bindProfile(User user) {
        binding.tvUsername.setText(user.username);
        binding.tvBio.setText(user.bio != null ? user.bio : "");

        if (user.avatar != null && !user.avatar.isEmpty()) {
            Glide.with(this).load(user.avatar).centerCrop().into(binding.ivAvatar);
        }

        int followerCount = user.followers != null ? user.followers.size() : 0;
        int followingCount = user.following != null ? user.following.size() : 0;
        binding.tvFollowerCount.setText(String.valueOf(followerCount));
        binding.tvFollowingCount.setText(String.valueOf(followingCount));

        String currentUsername = sessionManager.getUsername();
        boolean isOwnProfile = username.equals(currentUsername);

        if (isOwnProfile) {
            binding.btnFollowEdit.setText("Profili Düzenle");
            binding.btnFollowEdit.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileActivity.this, EditProfileActivity.class);
                intent.putExtra("username", user.username);
                intent.putExtra("bio", user.bio);
                intent.putExtra("avatar", user.avatar);
                startActivityForResult(intent, 100);
            });
        } else {
            String currentUserId = sessionManager.getUserId();
            boolean isFollowing = user.followers != null && currentUserId != null && user.followers.contains(currentUserId);
            binding.btnFollowEdit.setText(isFollowing ? "Takibi Bırak" : "Takip Et");
            binding.btnFollowEdit.setOnClickListener(v -> toggleFollow());
        }
    }

    private void toggleFollow() {
        ApiClient.getService(this).toggleFollow(username).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                if (response.isSuccessful() && response.body() != null) {
                    profileUser = response.body();
                    bindProfile(profileUser);
                }
            }
            @Override
            public void onFailure(Call<User> call, Throwable t) {
                Toast.makeText(ProfileActivity.this, "İşlem başarısız", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loadUserPosts() {
        ApiClient.getService(this).getUserPosts(username).enqueue(new Callback<List<Post>>() {
            @Override
            public void onResponse(Call<List<Post>> call, Response<List<Post>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    postAdapter.setPosts(response.body());
                }
            }
            @Override
            public void onFailure(Call<List<Post>> call, Throwable t) {}
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 100 && resultCode == RESULT_OK) {
            loadProfile();
        }
    }
}
