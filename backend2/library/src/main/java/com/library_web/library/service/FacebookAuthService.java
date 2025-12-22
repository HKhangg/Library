package com.library_web.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class FacebookAuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenService tokenService;

    public Map<String, Object> signInWithFacebook(String accessToken) {
        try {
            OkHttpClient client = new OkHttpClient();

            Request request = new Request.Builder()
                .url("https://graph.facebook.com/me?fields=id,name,email&access_token=" + accessToken)
                .build();

            Response response = client.newCall(request).execute();

            if (!response.isSuccessful()) {
                return Map.of(
                    "status", "FAIL",
                    "message", "Không lấy được thông tin người dùng từ Facebook",
                    "error", response.message()
                );
            }

            String body = response.body().string();
            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(body);

            String email = jsonNode.has("email") ? jsonNode.get("email").asText() : null;
            String name = jsonNode.has("name") ? jsonNode.get("name").asText() : "";
            String facebookId = jsonNode.has("id") ? jsonNode.get("id").asText() : null;

            if (email == null) {
                return Map.of(
                    "status", "FAIL",
                    "message", "Không lấy được email từ Facebook"
                );
            }

            if (facebookId == null) {
                return Map.of(
                    "status", "FAIL",
                    "message", "Không lấy được ID người dùng từ Facebook"
                );
            }

            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;
            if (userOpt.isEmpty()) {
                user = new User();
                user.setUsername(email.split("@")[0]);
                user.setEmail(email);
                user.setFullname(name);
                user.setProvider("FACEBOOK");
                user.setProviderId(facebookId);
                user.setPassword(""); // Không cần password
                user.setRole("USER");
                user.setJoined_date(LocalDate.now());
                userRepository.save(user);
            } else {
                user = userOpt.get();
                // Cập nhật thông tin nếu cần
                if (!"FACEBOOK".equals(user.getProvider())) {
                    user.setProvider("FACEBOOK");
                    user.setProviderId(facebookId);
                    userRepository.save(user);
                }
            }

            String accessTokenJwt = tokenService.createAccessToken(user.getId(), user.getRole());
            String refreshTokenJwt = tokenService.createRefreshToken(user.getId());

            return Map.of(
                "status", "OK",
                "message", "Đăng nhập bằng Facebook thành công",
                "data", Map.of(
                    "accessToken", accessTokenJwt,
                    "refreshToken", refreshTokenJwt,
                    "user", Map.of(
                        "id", user.getId(),
                        "username", user.getUsername() != null ? user.getUsername() : "",
                        "email", user.getEmail() != null ? user.getEmail() : "",
                        "phone", user.getPhone() != null ? user.getPhone() : "",
                        "fullname", user.getFullname() != null ? user.getFullname() : "",
                        "birthdate", user.getBirthdate() != null ? user.getBirthdate().toString() : "",
                        "role", user.getRole() != null ? user.getRole() : ""
                    )
                )
            );
        } catch (Exception e) {
            return Map.of(
                "status", "FAIL",
                "message", "Lỗi khi xác thực với Facebook: " + e.getMessage(),
                "error", e.getClass().getSimpleName()
            );
        }
    }
}