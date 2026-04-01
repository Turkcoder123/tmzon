package app.tmzon;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ItemPostBinding;
import app.tmzon.model.Post;
import app.tmzon.util.SessionManager;
import com.bumptech.glide.Glide;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PostAdapter extends RecyclerView.Adapter<PostAdapter.PostViewHolder> {
    private final Context context;
    private List<Post> posts;
    private final SessionManager sessionManager;

    public PostAdapter(Context context, List<Post> posts) {
        this.context = context;
        this.posts = posts;
        this.sessionManager = new SessionManager(context);
    }

    public void setPosts(List<Post> posts) {
        this.posts = posts;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public PostViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemPostBinding binding = ItemPostBinding.inflate(LayoutInflater.from(context), parent, false);
        return new PostViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull PostViewHolder holder, int position) {
        Post post = posts.get(position);
        holder.bind(post);
    }

    @Override
    public int getItemCount() {
        return posts.size();
    }

    class PostViewHolder extends RecyclerView.ViewHolder {
        private final ItemPostBinding binding;

        PostViewHolder(ItemPostBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(Post post) {
            if (post.author != null) {
                binding.tvUsername.setText(post.author.username);
                if (post.author.avatar != null && !post.author.avatar.isEmpty()) {
                    Glide.with(context).load(post.author.avatar).centerCrop().into(binding.ivAvatar);
                }
                binding.tvUsername.setOnClickListener(v -> {
                    Intent intent = new Intent(context, ProfileActivity.class);
                    intent.putExtra("username", post.author.username);
                    context.startActivity(intent);
                });
            }

            binding.tvContent.setText(post.content);
            if (post.createdAt != null && post.createdAt.length() >= 10) {
                binding.tvCreatedAt.setText(post.createdAt.substring(0, 10));
            } else {
                binding.tvCreatedAt.setText(post.createdAt != null ? post.createdAt : "");
            }

            int likeCount = post.likes != null ? post.likes.size() : 0;
            binding.tvLikeCount.setText(String.valueOf(likeCount));

            int commentCount = post.comments != null ? post.comments.size() : 0;
            binding.tvCommentCount.setText(String.valueOf(commentCount));

            String currentUserId = sessionManager.getUserId();
            boolean isLiked = post.likes != null && currentUserId != null && post.likes.contains(currentUserId);
            binding.btnLike.setImageResource(isLiked ? android.R.drawable.btn_star_big_on : android.R.drawable.btn_star_big_off);

            binding.btnLike.setOnClickListener(v -> {
                ApiClient.getService(context).toggleLike(post.id).enqueue(new Callback<Post>() {
                    @Override
                    public void onResponse(Call<Post> call, Response<Post> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            Post updated = response.body();
                            int idx = getAdapterPosition();
                            if (idx != RecyclerView.NO_POSITION) {
                                posts.set(idx, updated);
                                notifyItemChanged(idx);
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<Post> call, Throwable t) {}
                });
            });

            binding.btnComment.setOnClickListener(v -> {
                Intent intent = new Intent(context, PostDetailActivity.class);
                intent.putExtra("post_id", post.id);
                context.startActivity(intent);
            });

            String currentUsername = sessionManager.getUsername();
            boolean isOwner = post.author != null && post.author.username != null
                && post.author.username.equals(currentUsername);
            binding.btnDelete.setVisibility(isOwner ? View.VISIBLE : View.GONE);
            binding.btnDelete.setOnClickListener(v -> {
                ApiClient.getService(context).deletePost(post.id).enqueue(new Callback<Void>() {
                    @Override
                    public void onResponse(Call<Void> call, Response<Void> response) {
                        if (response.isSuccessful()) {
                            int idx = getAdapterPosition();
                            if (idx != RecyclerView.NO_POSITION) {
                                posts.remove(idx);
                                notifyItemRemoved(idx);
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<Void> call, Throwable t) {}
                });
            });
        }
    }
}
