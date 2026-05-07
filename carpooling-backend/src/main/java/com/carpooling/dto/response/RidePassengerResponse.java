package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
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

    // Ride snapshot for trip history view
    private Long driverId;
    private String driverName;
    private String vehicleNumber;
    private String pickupLabel;
    private String dropoffLabel;
    private OffsetDateTime departureTime;
    private BigDecimal fare;
    private String scheduleStatus;
}
