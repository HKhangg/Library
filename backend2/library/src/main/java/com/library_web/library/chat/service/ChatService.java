package com.library_web.library.chat.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    @Autowired
    private LangChainService langChainService;
    @Autowired
    private ChatMemoryService chatMemoryService;

    public String processMessage(String userId, String userMessage) {
        Long userIdLong;
        try {
            userIdLong = Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return "Lỗi: ID người dùng không hợp lệ. Bạn thử đăng nhập lại xem sao.";
        }
        return langChainService.getResponse(userIdLong, userMessage);
    }

    public void clearHistory(String userId) {
        try {
            chatMemoryService.clearChatHistory(Long.parseLong(userId));
        } catch (NumberFormatException e) {
            System.err.println("Lỗi khi xóa lịch sử: ID người dùng không hợp lệ - " + userId);
        } catch (Exception e) {
            System.err.println("Lỗi khi gọi chatMemoryService.clearChatHistory: " + e.getMessage());
            e.printStackTrace();
        }
    }
}