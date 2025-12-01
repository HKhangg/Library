package com.library_web.library.service;

import com.library_web.library.security.JwtUtil;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    // Tạo Access Token
    public String createAccessToken(Long id, String role) {
        return JwtUtil.generateAccessToken(id, role);
    }

    // Tạo Refresh Token
    public String createRefreshToken(Long id) {
        return JwtUtil.generateRefreshToken(id);
    }

    // Kiểm tra tính hợp lệ của Access Token
    public boolean validateToken(String token) {
        try {
            JwtUtil.validateToken(token); // Kiểm tra token hợp lệ
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // Lấy id từ token
    public Long getIdFromToken(String token) {
        try {
            return JwtUtil.getIdFromToken(token); // Lấy id từ token
        } catch (Exception e) {
            return null; // Nếu token không hợp lệ, trả về null
        }
    }

    // Lấy role từ token
    public String getRoleFromToken(String token) {
        try {
            return JwtUtil.getRoleFromToken(token); // Lấy role từ token
        } catch (Exception e) {
            return null; // Nếu token không hợp lệ, trả về null
        }
    }

    // Làm mới Access Token bằng Refresh Token
    public String refreshAccessToken(String refreshToken) {
        if (validateToken(refreshToken)) {
            Long id = getIdFromToken(refreshToken); // Lấy id từ refresh token
            if (id != null) {
                String role = getRoleFromToken(refreshToken); // Lấy role từ refresh token
                return createAccessToken(id, role); // Tạo access token mới với id và role
            }
        }
        return null; // Nếu Refresh Token không hợp lệ
    }
}