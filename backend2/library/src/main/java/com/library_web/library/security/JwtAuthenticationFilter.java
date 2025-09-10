package com.library_web.library.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.library_web.library.service.TokenService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final TokenService tokenService;

    public JwtAuthenticationFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String token = request.getHeader("Authorization");

        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
                Long id = tokenService.getIdFromToken(token); // Lấy id từ token
                if (id != null) {
                    String role = tokenService.getRoleFromToken(token); // Lấy role từ token
                    var auth = new UsernamePasswordAuthenticationToken(
                            id, // Sử dụng id làm principal
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority(role)) // Gán role vào quyền
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // Token không hợp lệ thì bỏ qua, SecurityConfig sẽ chặn Unauthorized
            }
        }

        // BẮT BUỘC phải gọi tiếp chain
        chain.doFilter(request, response);
    }
}