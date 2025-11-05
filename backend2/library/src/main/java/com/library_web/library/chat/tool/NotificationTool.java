package com.library_web.library.chat.tool;

import com.library_web.library.model.Notification;
import com.library_web.library.service.NotificationService;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class NotificationTool {

    @Autowired
    private NotificationService notificationService;

    @Tool("Dùng tool này để lấy các thông báo CHƯA ĐỌC của user. Chỉ cần userId.")
    public String getUnreadNotifications(String userId) {
        try {
            Long uId = Long.parseLong(userId);
            List<Notification> notifs = notificationService.getUnreadNotifications(uId);

            if (notifs == null || notifs.isEmpty()) {
                return "Bạn không có thông báo mới nào chưa đọc hết!";
            }

            String messages = notifs.stream()
                .map(notif -> "- " + notif.getMessage())
                .collect(Collectors.joining("\n")); 
            
            return "Bạn có " + notifs.size() + " thông báo mới chưa đọc nè:\n" + messages;

        } catch (Exception e) {
            return "Ui, tui gặp chút lỗi khi kiểm tra thông báo: " + e.getMessage() + ". Bạn thử lại sau nha.";
        }
    }
}