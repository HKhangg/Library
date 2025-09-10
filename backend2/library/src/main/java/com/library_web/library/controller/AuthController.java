package com.library_web.library.controller;

import com.library_web.library.dto.UserDTO;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.service.UserService;
import com.library_web.library.service.GoogleAuthService;
import com.library_web.library.service.FacebookAuthService;
import com.library_web.library.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private GoogleAuthService googleAuthService;

    @Autowired
    private FacebookAuthService facebookAuthService;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody UserDTO userDTO) {

        if (userDTO.getEmail() != null && !userDTO.getEmail().isBlank() &&
                userRepository.findByEmail(userDTO.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại");
        }
        if (userDTO.getPhone() != null && !userDTO.getPhone().isBlank() &&
                userRepository.findByPhone(userDTO.getPhone()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại đã tồn tại");
        }
        if (userRepository.findByUsername(userDTO.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên đăng nhập đã tồn tại");
        }

        return userService.register(userDTO);
    }

    @PostMapping("/register/verify-otp")
    public Map<String, Object> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        Map<String, Object> response = userService.verifyOtpAndCreate(email, otp);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP không chính xác hoặc đã hết hạn");
        }
        return response;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String emailOrPhone = request.get("email");
        if (emailOrPhone == null || emailOrPhone.isBlank()) {
            emailOrPhone = request.get("phone");
        }
        String password = request.get("password");
        String isFEAdmin = request.get("isFEAdmin");
        if (isFEAdmin == null) {
            isFEAdmin = "false"; // Mặc định là false nếu không có trường này
        }
        Boolean isAdmin = Boolean.parseBoolean(isFEAdmin);

        Map<String, Object> response = userService.login(emailOrPhone, password, isAdmin);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email/số điện thoại hoặc mật khẩu không đúng");
        }

        if (response.containsKey("data") && ((Map<String, Object>) response.get("data")).containsKey("accessToken")) {
            Map<String, Object> userData = (Map<String, Object>) ((Map<String, Object>) response.get("data"))
                    .get("user");
            String username = (String) userData.get("username");
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Không tìm thấy người dùng sau khi đăng nhập"));
            cartService.getOrCreateCart(user);
        }

        return response;
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> request) {
        String emailOrPhone = request.get("emailOrPhone");
        Map<String, Object> response = userService.forgotPassword(emailOrPhone);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Không tìm thấy người dùng với email hoặc số điện thoại này");
        }
        return response;
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> request) {
        String emailOrPhone = request.get("emailOrPhone");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        Map<String, Object> response = userService.resetPassword(emailOrPhone, otp, newPassword);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "OTP không chính xác, đã hết hạn hoặc không tìm thấy người dùng");
        }
        return response;
    }


   
    @PostMapping("/auth/google")
public ResponseEntity<?> loginWithGoogle(@RequestBody Map<String, String> body) {
    String accessToken = body.get("accessToken"); // Match frontend key
    if (accessToken == null || accessToken.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google Access Token không được để trống");
    }

    try {
        Map<String, Object> response = userService.loginWithGoogle(accessToken);
        if (response == null || !"OK".equals(response.get("status"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Google Login thất bại: " + response.getOrDefault("message", "IdToken không hợp lệ"));
        }

        Map<String, Object> data = (Map<String, Object>) response.get("data");
        if (data != null && data.containsKey("user")) {
            Map<String, Object> userMap = (Map<String, Object>) data.get("user");
            String email = (String) userMap.get("email");
            if (email != null && !email.isBlank()) {
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Không tìm thấy người dùng sau khi đăng nhập bằng Google"));
                cartService.getOrCreateCart(user);
            }
        }

        return ResponseEntity.ok(response);
    } catch (Exception ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Google Login thất bại: " + ex.getMessage()));
    }
}

    @PostMapping("/auth/facebook")
    public ResponseEntity<?> loginWithFacebook(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "status", "FAIL",
                    "message", "Facebook Access Token không được để trống"
                ));
        }

        try {
            Map<String, Object> response = facebookAuthService.signInWithFacebook(accessToken);
            if (!"OK".equals(response.get("status"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(response);
            }

            // Lấy thông tin người dùng từ response
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            Map<String, Object> userInfo = (Map<String, Object>) data.get("user");
            String username = (String) userInfo.get("username");

            // Tạo hoặc lấy giỏ hàng cho người dùng
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy người dùng sau khi đăng nhập bằng Facebook"
                ));
            cartService.getOrCreateCart(user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "status", "FAIL",
                    "message", "Lỗi khi đăng nhập bằng Facebook: " + e.getMessage(),
                    "error", e.getClass().getSimpleName()
                ));
        }
    }


    // @PostMapping("/password/reset")
    // public ResponseEntity<?> resetPasswordDuplicate(@RequestBody Map<String,
    // String> request) {
    // String emailOrPhone = request.get("emailOrPhone");
    // String otp = request.get("otp");
    // String newPassword = request.get("newPassword");

    // Map<String, Object> response = userService.resetPassword(emailOrPhone, otp,
    // newPassword);
    // if (response == null) {
    // throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
    // "OTP không chính xác, đã hết hạn hoặc không tìm thấy người dùng");
    // }
    // return ResponseEntity.ok(response);
    // }

    @GetMapping("/refresh-token")
    public Map<String, Object> refreshToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu header Authorization với Bearer Token");
        }

        String refreshToken = authHeader.substring(7);
        if (refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh Token không được để trống");
        }

        Map<String, Object> response = userService.refreshAccessToken(refreshToken);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh Token không hợp lệ hoặc đã hết hạn");
        }
        return response;
    }
    @PutMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody Map<String, String> request) {
        Long id = request.get("id").isBlank() ? null : Long.parseLong(request.get("id"));
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        Map<String, Object> response = userService.changePassword(id, oldPassword, newPassword);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu cũ không đúng hoặc không tìm thấy người dùng");
        }
        return response;
    }
}