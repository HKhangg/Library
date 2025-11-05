package com.library_web.library.chat.tool;

import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository; 
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserTool {

    @Autowired
    private UserRepository userRepository;

    @Tool("Dùng tool này để lấy thông tin chi tiết của user (ví dụ: tên, email, sđt). Chỉ cần userId.")
    public String getUserInfo(String userId) {
        try {
            Long uId = Long.parseLong(userId);
            
            User user = userRepository.findById(uId)
                .orElseThrow(() -> new RuntimeException("Xin lỗi, tui không tìm thấy thông tin người dùng ID: " + userId));

            return "Oce, đây là thông tin của bạn nè: \nTên đầy đủ: " + user.getFullname() + "\nEmail: " + user.getEmail() + "\nSố điện thoại: " + user.getPhone();
            
        } catch (Exception e) {
            return "Ui, tui gặp lỗi khi tìm thông tin của bạn: " + e.getMessage();
        }
    }
}