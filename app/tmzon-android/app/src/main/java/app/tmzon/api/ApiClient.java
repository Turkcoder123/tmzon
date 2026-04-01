package app.tmzon.api;

import android.content.Context;
import app.tmzon.util.SessionManager;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static final String BASE_URL = "http://144.172.97.3:3000/";
    private static Retrofit retrofit;

    public static ApiService getService(Context context) {
        if (retrofit == null) {
            SessionManager session = new SessionManager(context.getApplicationContext());

            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(chain -> {
                    Request original = chain.request();
                    String token = session.getToken();
                    if (token != null) {
                        Request request = original.newBuilder()
                            .header("Authorization", "Bearer " + token)
                            .build();
                        return chain.proceed(request);
                    }
                    return chain.proceed(original);
                })
                .addInterceptor(logging)
                .build();

            retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        }
        return retrofit.create(ApiService.class);
    }

    public static void reset() {
        retrofit = null;
    }
}
