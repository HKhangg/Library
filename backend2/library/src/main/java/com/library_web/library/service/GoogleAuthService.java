package com.library_web.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class GoogleAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TokenService tokenService;

    public Map<String, Object> signInWithGoogle(String accessToken) {
    try {
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder()
                .url("https://www.googleapis.com/oauth2/v3/userinfo")
                .addHeader("Authorization", "Bearer " + accessToken)
                .build();

        Response response = client.newCall(request).execute();
        String json = response.body().string();
        System.out.println("Google API Response: " + json); // Log for debugging
        if (!response.isSuccessful()) {
            throw new RuntimeException("Failed to fetch user info from Google: " + json);
        }

        ObjectMapper mapper = new ObjectMapper();
        JsonNode userInfo = mapper.readTree(json);

        String email = userInfo.get("email") != null ? userInfo.get("email").asText() : null;
        String name = userInfo.get("name") != null ? userInfo.get("name").asText() : null;
        String googleId = userInfo.get("sub") != null ? userInfo.get("sub").asText() : null;

        if (email == null) {
            throw new RuntimeException("Email not found in Google response");
        }

        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user = optionalUser.orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(email);
            newUser.setFullname(name != null ? name : "");
            newUser.setProvider("GOOGLE");
            // newUser.setId(Long.valueOf(googleId)); // Uncomment if you want to set ID from Google ID and your User entity supports it
            // If your User entity uses auto-generated IDs, you should not set the ID manually.
            newUser.setProviderId(googleId);
            newUser.setPassword(passwordEncoder.encode("")); // Empty password
            newUser.setRole("USER");
            userRepository.save(newUser);
            return newUser;
        });

        String accessTokenJwt = tokenService.createAccessToken(user.getId(), user.getRole());
        String refreshTokenJwt = tokenService.createRefreshToken(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("status", "OK");
        result.put("message", "Đăng nhập thành công");
        result.put("access_token", accessTokenJwt);
        result.put("refresh_token", refreshTokenJwt);
        // Add userInfo to match UserService expectations
        result.put("userInfo", Map.of(
                "email", email,
                "name", name != null ? name : ""
        ));

        return result;
    } catch (Exception e) {
        Map<String, Object> error = new HashMap<>();
        error.put("status", "FAIL");
        error.put("message", "Đăng nhập thất bại");
        error.put("error", e.getMessage());
        return error;
    }
}
}