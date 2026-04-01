package app.tmzon;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.FragmentFeedBinding;
import app.tmzon.model.Post;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class FeedFragment extends Fragment {
    public static final String TYPE_ALL = "all";
    public static final String TYPE_FEED = "feed";
    private static final String ARG_TYPE = "type";

    private FragmentFeedBinding binding;
    private PostAdapter adapter;
    private String type;

    public static FeedFragment newInstance(String type) {
        FeedFragment f = new FeedFragment();
        Bundle args = new Bundle();
        args.putString(ARG_TYPE, type);
        f.setArguments(args);
        return f;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        type = getArguments() != null ? getArguments().getString(ARG_TYPE, TYPE_ALL) : TYPE_ALL;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentFeedBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        adapter = new PostAdapter(requireContext(), new ArrayList<>());
        binding.recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recyclerView.setAdapter(adapter);

        binding.swipeRefresh.setOnRefreshListener(this::loadPosts);
        loadPosts();
    }

    public void refresh() {
        loadPosts();
    }

    private void loadPosts() {
        binding.swipeRefresh.setRefreshing(true);
        Callback<List<Post>> callback = new Callback<List<Post>>() {
            @Override
            public void onResponse(Call<List<Post>> call, Response<List<Post>> response) {
                if (binding == null) return;
                binding.swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    adapter.setPosts(response.body());
                }
            }

            @Override
            public void onFailure(Call<List<Post>> call, Throwable t) {
                if (binding == null) return;
                binding.swipeRefresh.setRefreshing(false);
            }
        };

        if (TYPE_FEED.equals(type)) {
            ApiClient.getService(requireContext()).getFeedPosts().enqueue(callback);
        } else {
            ApiClient.getService(requireContext()).getAllPosts().enqueue(callback);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
