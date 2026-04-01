package app.tmzon;

import android.os.Bundle;
import android.view.View;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import app.tmzon.api.ApiClient;
import app.tmzon.databinding.ActivityEditProfileBinding;
import app.tmzon.model.User;
import app.tmzon.util.SessionManager;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EditProfileActivity extends AppCompatActivity {
    private ActivityEditProfileBinding binding;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditProfileBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setSupportActionBar(binding.toolbar);
        binding.toolbar.setNavigationOnClickListener(v -> finish());

        sessionManager = new SessionManager(this);

        String username = getIntent().getStringExtra("username");
        String bio = getIntent().getStringExtra("bio");
        String avatar = getIntent().getStringExtra("avatar");

        if (username != null) binding.etUsername.setText(username);
        if (bio != null) binding.etBio.setText(bio);
        if (avatar != null) binding.etAvatar.setText(avatar);

        binding.btnSave.setOnClickListener(v -> saveProfile());
    }

    private void saveProfile() {
        String username = binding.etUsername.getText() != null ? binding.etUsername.getText().toString().trim() : "";
        String bio = binding.etBio.getText() != null ? binding.etBio.getText().toString().trim() : "";
        String avatar = binding.etAvatar.getText() != null ? binding.etAvatar.getText().toString().trim() : "";

        if (username.isEmpty()) {
            binding.tilUsername.setError("Kullanıcı adı gerekli");
            return;
        }
        binding.tilUsername.setError(null);
        setLoading(true);

        Map<String, String> body = new HashMap<>();
        body.put("username", username);
        body.put("bio", bio);
        body.put("avatar", avatar);

        ApiClient.getService(this).updateMe(body).enqueue(new Callback<User>() {
            @Override
            public void onResponse(Call<User> call, Response<User> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    User updated = response.body();
                    sessionManager.saveSession(sessionManager.getToken(), updated.id, updated.username);
                    Toast.makeText(EditProfileActivity.this, "Profil güncellendi", Toast.LENGTH_SHORT).show();
                    setResult(RESULT_OK);
                    finish();
                } else {
                    Toast.makeText(EditProfileActivity.this, "Güncelleme başarısız", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<User> call, Throwable t) {
                setLoading(false);
                Toast.makeText(EditProfileActivity.this, "Bağlantı hatası", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setLoading(boolean loading) {
        binding.progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        binding.btnSave.setEnabled(!loading);
    }
}
