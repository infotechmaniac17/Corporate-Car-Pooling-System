package com.carpooling.service;

import com.carpooling.dto.request.SendMessageRequest;
import com.carpooling.dto.response.ChatMessageResponse;
import com.carpooling.entity.ChatMessage;

import java.util.List;

public interface ChatService {
    ChatMessage sendMessage(Long senderId, SendMessageRequest request);
    List<ChatMessageResponse> getMessages(Long rideId);
    void markMessagesRead(Long rideId, Long userId);
    long getUnreadCount(Long rideId, Long userId);
}
