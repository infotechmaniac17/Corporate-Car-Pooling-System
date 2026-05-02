package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.SendMessageRequest;
import com.carpooling.dto.response.ChatMessageResponse;
import com.carpooling.entity.ChatMessage;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.ChatMessageRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ChatMessage sendMessage(Long senderId, SendMessageRequest request) {
        RideSchedule schedule = rideScheduleRepository.findById(request.getRideId())
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", request.getRideId()));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", senderId));

        if (schedule.getStatus() != ScheduleStatus.ACTIVE && schedule.getStatus() != ScheduleStatus.STARTED) {
            throw new BusinessException("Chat only available for active or started rides");
        }

        ChatMessage msg = chatMessageRepository.save(ChatMessage.builder()
                .rideSchedule(schedule)
                .sender(sender)
                .message(request.getMessage())
                .build());

        messagingTemplate.convertAndSend(
                "/topic/ride/" + request.getRideId() + "/chat",
                Map.of(
                        "messageId", msg.getId(),
                        "senderId", senderId,
                        "senderName", sender.getName(),
                        "message", msg.getMessage(),
                        "timestamp", msg.getCreatedAt().toString()
                ));

        return msg;
    }

    @Override
    public List<ChatMessageResponse> getMessages(Long rideId) {
        return chatMessageRepository.findByRideScheduleIdOrderByCreatedAtAsc(rideId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void markMessagesRead(Long rideId, Long userId) {
        chatMessageRepository.markAllReadForUser(rideId, userId);
    }

    @Override
    public long getUnreadCount(Long rideId, Long userId) {
        return chatMessageRepository.countByRideScheduleIdAndIsReadFalseAndSenderIdNot(rideId, userId);
    }

    private ChatMessageResponse toResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .rideId(m.getRideSchedule().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .message(m.getMessage())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
