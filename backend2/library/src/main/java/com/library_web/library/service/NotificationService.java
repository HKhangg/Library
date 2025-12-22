package com.library_web.library.service;

import com.library_web.library.model.Notification;
import com.library_web.library.model.User;
import com.library_web.library.repository.NotificationRepository;
import com.library_web.library.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

  @Autowired
  private NotificationRepository notificationRepository;
  @Autowired
  private UserRepository userRepository;

  // Gửi thông báo mới
  public Notification sendNotification(Long userId, String message) {
    Notification notification = new Notification();
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));
    notification.setUserId(user);
    notification.setMessage(message);
    notification.setTimestamp(LocalDateTime.now());
    notification.setRead(false);
    return notificationRepository.save(notification);
  }

  public List<Notification> getAllNotifications() {
    return notificationRepository.findAll(); // Trả về tất cả thông báo trong database
  }

  // Lấy tất cả thông báo của người dùng theo userId
  public List<Notification> getAllNotifications(Long userId) {
     User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
    return notificationRepository.findByUserId(user);
  }

  // Lấy thông báo chưa đọc
  public List<Notification> getUnreadNotifications(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
    return notificationRepository.findByUserIdAndIsRead(user, false);
  }

  // Đánh dấu thông báo là đã đọc
  public Notification markAsRead(Long id) {
    Notification notification = notificationRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Ko tìm thấy thông báo"));
    if (!notification.isRead()) {
      notification.setRead(true);
      return notificationRepository.save(notification);
    }
    return notification;
  }
}