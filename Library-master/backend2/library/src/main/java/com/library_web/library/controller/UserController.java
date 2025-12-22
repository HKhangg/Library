package com.library_web.library.controller;

import com.library_web.library.dto.UserDTO;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import com.library_web.library.service.TempStorage;
import com.library_web.library.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping()
    public List<User> layTatCaNguoiDung() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String currentRole = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .iterator().next().getAuthority();

        if (currentRole.equals("USER")) {
            User user = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Không tìm thấy người dùng với username: " + currentUsername));
            return List.of(user);
        }

        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public User layUserTheoId(@PathVariable Long id) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String currentRole = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .iterator().next().getAuthority();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng với ID: " + id));

        
        // Đảm bảo avatar_url không bao giờ là chuỗi rỗng
        if (user.getAvatar_url() != null && user.getAvatar_url().isEmpty()) {
            user.setAvatar_url(null);
        }

        return user;
    }


    @PutMapping("/{id}")
    public Map<String, Object> updateUser(@PathVariable Long id, @RequestBody Map<String, String> updates) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy người dùng với ID: " + id));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        String currentRole = SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .iterator().next().getAuthority();
       
        if (currentRole.equals("USER") && !currentUsername.equals(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền cập nhật thông tin người dùng này");
        }
        UserDTO userDto = new UserDTO();
        // Cập nhật các trường hợp có thể
        if (updates.containsKey("fullname")) {
            userDto.setFullname(updates.get("fullname"));
        }
        if (updates.containsKey("email")) {
            userDto.setEmail(updates.get("email"));
        }
        if (updates.containsKey("phone")) {
            userDto.setPhone(updates.get("phone"));
        }
        if (updates.containsKey("birthdate")) {
            String birthdateStr = updates.get("birthdate");
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate birthdate = LocalDate.parse(birthdateStr, formatter);
            userDto.setBirthdate(birthdate);
        }
        if (updates.containsKey("role")) {
            userDto.setRole(updates.get("role"));
        }
        if (updates.containsKey("gender")) {
            userDto.setGender(updates.get("gender"));
        }
        if (updates.containsKey("avatar_url")) {
            userDto.setAvatar_url(updates.get("avatar_url"));
        }

        return userService.updateUser(id, userDto);

    }

    @PostMapping("/verify-email-update")
    public Map<String, Object> verifyEmailUpdate(@RequestBody Map<String, String> payload) {
        Long id = Long.parseLong(payload.get("id"));
        String email = payload.get("email");
        String otp = payload.get("otp");
        return userService.verifyEmailUpdate(id, email, otp);
    }
}
