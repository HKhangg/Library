package com.library_web.library.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import org.springframework.beans.factory.annotation.Value;
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${spring.web.cors.allowed-origins}")
    private String allowedOrigin;
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Cho phép mọi domain (hoặc có thể thay bằng URL cụ thể như http://localhost:3000)
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://is-203-quan-ly-thu-vien-2e4f5aq1r.vercel.app")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH") // Các phương thức được phép
                .allowedHeaders("*") // Cho phép tất cả header
                .allowCredentials(true); // Cho phép gửi cookie nếu cần
                
    }
    
}