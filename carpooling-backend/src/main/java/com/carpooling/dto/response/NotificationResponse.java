package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String body;
    private String type;
    private Long rideId;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}
