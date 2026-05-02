package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class SosIncidentResponse {
    private Long id;
    private Long rideId;
    private Long triggeredById;
    private String triggeredByName;
    private Double latitude;
    private Double longitude;
    private OffsetDateTime createdAt;
}
