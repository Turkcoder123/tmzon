package app.tmzon;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.WindowManager;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ActivityMainBinding;
import app.tmzon.databinding.DialogCreatePostBinding;
import app.tmzon.model.Post;
import app.tmzon.util.SessionManager;
import com.google.android.material.tabs.TabLayoutMediator;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {
    private ActivityMainBinding binding;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        sessionManager = new SessionManager(this);
        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        setSupportActionBar(binding.toolbar);

        binding.viewPager.setAdapter(new FeedPagerAdapter(this));
        new TabLayoutMediator(binding.tabLayout, binding.viewPager, (tab, position) -> {
            tab.setText(position == 0 ? "Keşfet" : "Takip Edilenler");
        }).attach();

        binding.fabNewPost.setOnClickListener(v -> showCreatePostDialog());
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, 1, 0, "Profil");
        menu.add(0, 2, 0, "Çıkış Yap");
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == 1) {
            Intent intent = new Intent(this, ProfileActivity.class);
            intent.putExtra("username", sessionManager.getUsername());
            startActivity(intent);
            return true;
        } else if (item.getItemId() == 2) {
            sessionManager.clearSession();
            ApiClient.reset();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void showCreatePostDialog() {
        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            return;
        }

        DialogCreatePostBinding dialogBinding = DialogCreatePostBinding.inflate(getLayoutInflater());
        AlertDialog dialog = new AlertDialog.Builder(this)
            .setView(dialogBinding.getRoot())
            .create();

        dialogBinding.btnCancel.setOnClickListener(v -> dialog.dismiss());
        dialogBinding.btnPost.setOnClickListener(v -> {
            String content = dialogBinding.etContent.getText() != null
                ? dialogBinding.etContent.getText().toString().trim() : "";
            if (content.isEmpty()) {
                dialogBinding.tilContent.setError("İçerik gerekli");
                return;
            }
            dialogBinding.tilContent.setError(null);
            dialogBinding.btnPost.setEnabled(false);

            Map<String, String> body = new HashMap<>();
            body.put("content", content);
            ApiClient.getService(this).createPost(body).enqueue(new Callback<Post>() {
                @Override
                public void onResponse(Call<Post> call, Response<Post> response) {
                    dialogBinding.btnPost.setEnabled(true);
                    if (response.isSuccessful()) {
                        dialog.dismiss();
                        refreshCurrentFeed();
                    }
                }

                @Override
                public void onFailure(Call<Post> call, Throwable t) {
                    dialogBinding.btnPost.setEnabled(true);
                }
            });
        });

        if (dialog.getWindow() != null) {
            dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
        }
        dialog.show();
        dialogBinding.etContent.requestFocus();
    }

    private void refreshCurrentFeed() {
        Fragment fragment = getSupportFragmentManager().findFragmentByTag("f" + binding.viewPager.getCurrentItem());
        if (fragment instanceof FeedFragment) {
            ((FeedFragment) fragment).refresh();
        }
    }

    static class FeedPagerAdapter extends FragmentStateAdapter {
        FeedPagerAdapter(FragmentActivity fa) { super(fa); }

        @Override
        public Fragment createFragment(int position) {
            return FeedFragment.newInstance(position == 0 ? FeedFragment.TYPE_ALL : FeedFragment.TYPE_FEED);
        }

        @Override
        public int getItemCount() { return 2; }
    }
}