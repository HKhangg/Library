package com.library_web.library.chat.service;

import com.library_web.library.chat.model.ChatMessage;
import com.library_web.library.chat.repository.ChatMessageRepository;
import com.library_web.library.model.User;
import com.library_web.library.repository.UserRepository;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatMemoryService {

    private static final Duration SESSION_TIMEOUT = Duration.ofHours(1);

    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private UserRepository userRepository;

    public void saveUserMessage(Long userId, String message) {
        saveMessage(userId, "USER", message);
    }

    public void saveBotMessage(Long userId, String message) {
        saveMessage(userId, "BOT", message);
    }

    public List<ChatMessage> getChatHistory(Long userId) {
        return chatMessageRepository.findByUser_IdOrderByTimestampAsc(userId);
    }

    public void clearChatHistory(Long userId) {
        chatMessageRepository.deleteByUser_Id(userId);
    }

    private void saveMessage(Long userId, String role, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user với ID: " + userId));
        
        String sessionId = getOrCreateSessionId(userId);

        ChatMessage chat = ChatMessage.builder()
                .sessionId(sessionId)
                .role(role)
                .message(content)
                .user(user)
                .timestamp(LocalDateTime.now())
                .build();

        chatMessageRepository.save(chat);
    }

    private String getOrCreateSessionId(Long userId) {
        Optional<ChatMessage> lastChat = chatMessageRepository.findTopByUser_IdOrderByTimestampDesc(userId);
        if (lastChat.isPresent()) {
            ChatMessage latest = lastChat.get();
            Duration sinceLastMsg = Duration.between(latest.getTimestamp(), LocalDateTime.now());
            if (sinceLastMsg.compareTo(SESSION_TIMEOUT) > 0) {
                return generateNextSessionId(userId, latest.getSessionId());
            } else {
                return latest.getSessionId();
            }
        } else {
            return "user_" + userId + "_session_1";
        }
    }

    private String generateNextSessionId(Long userId, String lastSessionId) {
        int nextNum = 1;
        if (lastSessionId != null && lastSessionId.startsWith("user_" + userId + "_session_")) {
            try {
                String numPart = lastSessionId.substring(lastSessionId.lastIndexOf("_") + 1);
                nextNum = Integer.parseInt(numPart) + 1;
            } catch (NumberFormatException ignored) {}
        }
        return "user_" + userId + "_session_" + nextNum;
    }

    public List<dev.langchain4j.data.message.ChatMessage> getHistoryAsLangChainMessages(Long userId) {
        return getChatHistory(userId).stream()
                .map(msg -> "USER".equalsIgnoreCase(msg.getRole())
                        ? UserMessage.from(msg.getMessage())
                        : AiMessage.from(msg.getMessage()))
                .collect(Collectors.toList());
    }
    
    @Scheduled(cron = "0 0 3 * * *")
    public void deleteOldMessages() {
        LocalDateTime cutoff = LocalDateTime.now().minusMonths(1);
        chatMessageRepository.deleteAllByTimestampBefore(cutoff);
        System.out.println("Đã dọn dẹp các chat_message cũ hơn 1 tháng rồi á.");
    }
}