package app.tmzon;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ItemCommentBinding;
import app.tmzon.model.Comment;
import app.tmzon.util.SessionManager;
import com.bumptech.glide.Glide;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CommentAdapter extends RecyclerView.Adapter<CommentAdapter.CommentViewHolder> {
    private final Context context;
    private final List<Comment> comments;
    private final String postId;
    private final SessionManager sessionManager;

    public CommentAdapter(Context context, List<Comment> comments, String postId) {
        this.context = context;
        this.comments = comments;
        this.postId = postId;
        this.sessionManager = new SessionManager(context);
    }

    @NonNull
    @Override
    public CommentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCommentBinding binding = ItemCommentBinding.inflate(LayoutInflater.from(context), parent, false);
        return new CommentViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull CommentViewHolder holder, int position) {
        holder.bind(comments.get(position));
    }

    @Override
    public int getItemCount() {
        return comments.size();
    }

    class CommentViewHolder extends RecyclerView.ViewHolder {
        private final ItemCommentBinding binding;

        CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(Comment comment) {
            if (comment.author != null) {
                binding.tvUsername.setText(comment.author.username);
                if (comment.author.avatar != null && !comment.author.avatar.isEmpty()) {
                    Glide.with(context).load(comment.author.avatar).centerCrop().into(binding.ivAvatar);
                }
            }
            binding.tvContent.setText(comment.content);

            String currentUsername = sessionManager.getUsername();
            boolean isOwner = comment.author != null && comment.author.username != null
                && comment.author.username.equals(currentUsername);
            binding.btnDelete.setVisibility(isOwner ? View.VISIBLE : View.GONE);
            binding.btnDelete.setOnClickListener(v -> {
                ApiClient.getService(context).deleteComment(postId, comment.id).enqueue(new Callback<Void>() {
                    @Override
                    public void onResponse(Call<Void> call, Response<Void> response) {
                        if (response.isSuccessful()) {
                            int idx = getAdapterPosition();
                            if (idx != RecyclerView.NO_POSITION) {
                                comments.remove(idx);
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
