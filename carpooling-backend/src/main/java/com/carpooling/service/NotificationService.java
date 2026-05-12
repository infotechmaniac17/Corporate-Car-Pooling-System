package com.carpooling.service;

import com.carpooling.dto.response.NotificationResponse;
import com.carpooling.enums.NotificationType;

import java.util.List;

public interface NotificationService {
    void send(Long recipientId, String title, String body, NotificationType type, Long rideId);
    List<NotificationResponse> getMyNotifications(Long userId);
    long getUnreadCount(Long userId);
    void markRead(Long notificationId, Long userId);
    void markAllRead(Long userId);
}
