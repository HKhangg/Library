package com.library_web.library.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

import com.library_web.library.model.User;

public class JwtUtil {

    private static final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24; // 1 ngày
    private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 1 tuần

    // Tạo Access Token với id và role
    public static String generateAccessToken(Long id, String role) {
        return Jwts.builder()
                .setSubject(String.valueOf(id)) // Dùng id làm subject 
                .claim("id", id) // Thêm id vào claims
                .claim("role", role) // Thêm role vào claims
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(key)
                .compact();
    }   

    // Tạo Refresh Token với id
    public static String generateRefreshToken(Long id) {
        return Jwts.builder()
                .setSubject(String.valueOf(id)) // Dùng id làm subject
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(key)
                .compact();
    }

    // Kiểm tra tính hợp lệ của token và lấy id từ token
    public static Long validateToken(String token) {
        try {
            String idStr = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject(); // Trả về id từ subject
            return Long.valueOf(idStr);
        } catch (Exception e) {
            throw new RuntimeException("Token không hợp lệ hoặc đã hết hạn", e);
        }
    }

    // Lấy id từ token
    public static Long getIdFromToken(String token) {
        return validateToken(token); // Gọi hàm validateToken để lấy id
    }

    // Lấy role từ token
    public static String getRoleFromToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return claims.get("role", String.class); // Trả về role từ claims
        } catch (Exception e) {
            throw new RuntimeException("Không thể lấy role từ token", e);
        }
    }
}