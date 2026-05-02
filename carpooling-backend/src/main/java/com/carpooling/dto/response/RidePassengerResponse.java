package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class RidePassengerResponse {
    private Long id;
    private Long rideId;
    private Long passengerId;
    private String passengerName;
    private String passengerEmail;
    private String status;
    private OffsetDateTime joinedAt;
}
