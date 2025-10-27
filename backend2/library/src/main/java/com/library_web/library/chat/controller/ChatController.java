package com.library_web.library.chat.controller;

import com.library_web.library.chat.model.ChatRequest;
import com.library_web.library.chat.model.ChatResponse;
import com.library_web.library.chat.service.ChatService; // Gọi "tổng đài"
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private ChatService chatService; 

    @PostMapping("/message")
    public ResponseEntity<ChatResponse> handleChatMessage(@RequestBody ChatRequest request) {
        
        String userId = request.getUserId();
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new ChatResponse("Lỗi: Không xác định được người dùng. Bạn vui lòng đăng nhập lại nhé."));
        }

        try {
            String reply = chatService.processMessage(userId, request.getMessage());
            return ResponseEntity.ok(new ChatResponse(reply));
        } catch (Exception e) {

            System.err.println("Lỗi trong ChatController: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new ChatResponse("Xin lỗi, tui đang gặp chút sự cố kỹ thuật. Bạn thử lại sau nha!"));
        }
    }
    

    // @DeleteMapping("/history/{userId}")
    // public ResponseEntity<Void> clearChatHistory(@PathVariable String userId) {
    //     if (userId == null || userId.trim().isEmpty()) {
    //         return ResponseEntity.badRequest().build();
    //     }
    //     chatService.clearHistory(userId);
    //     return ResponseEntity.ok().build();
    // }
}