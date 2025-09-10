package com.library_web.library.controller;

import com.library_web.library.model.Notification;
import com.library_web.library.service.NotificationService;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    // Gửi thông báo mới
    @PostMapping("/send")
    public ResponseEntity<Notification> sendNotification(@RequestParam Long userId, @RequestParam String message) {
        Notification notification = notificationService.sendNotification(userId, message);
        return ResponseEntity.ok(notification);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }

    // Lấy tất cả thông báo của người dùng
    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getAllNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getAllNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Lấy thông báo chưa đọc của người dùng
    @GetMapping("/unread/{userId}")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    // Đánh dấu thông báo đã đọc
    @PutMapping("/mark-as-read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Notification notification = notificationService.markAsRead(id);
            return ResponseEntity.ok(notification);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(404).body("Không tìm thấy thông báo");
        }
    }
}