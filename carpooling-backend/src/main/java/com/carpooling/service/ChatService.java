package com.carpooling.service;

import com.carpooling.dto.request.SendMessageRequest;
import com.carpooling.entity.ChatMessage;

import java.util.List;

public interface ChatService {
    ChatMessage sendMessage(Long senderId, SendMessageRequest request);
    List<ChatMessage> getMessages(Long rideId);
}
