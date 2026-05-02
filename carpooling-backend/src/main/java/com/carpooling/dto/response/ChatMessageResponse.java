package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class ChatMessageResponse {
    private Long id;
    private Long rideId;
    private Long senderId;
    private String senderName;
    private String message;
    private boolean isRead;
    private OffsetDateTime createdAt;
}
