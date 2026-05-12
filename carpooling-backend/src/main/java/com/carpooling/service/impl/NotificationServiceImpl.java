package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.response.NotificationResponse;
import com.carpooling.entity.Notification;
import com.carpooling.entity.User;
import com.carpooling.enums.NotificationType;
import com.carpooling.repository.NotificationRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void send(Long recipientId, String title, String body, NotificationType type, Long rideId) {
        User recipient = userRepository.getReferenceById(recipientId);
        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .title(title)
                .body(body)
                .type(type)
                .rideId(rideId)
                .build());

        try {
            messagingTemplate.convertAndSend(
                    "/topic/user/" + recipientId + "/notifications",
                    Map.of("id", saved.getId(), "title", title, "type", type.name(), "rideId", rideId != null ? rideId : 0));
        } catch (Exception e) {
            log.warn("WS push failed for user {}: {}", recipientId, e.getMessage());
        }
    }

    @Override
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));
        if (!n.getRecipient().getId().equals(userId)) {
            throw new BusinessException("Not authorized", HttpStatus.FORBIDDEN);
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadForUser(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .body(n.getBody())
                .type(n.getType().name())
                .rideId(n.getRideId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
