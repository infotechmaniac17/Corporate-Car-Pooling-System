package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder
public class MatchedRideResponse {
    private Long rideScheduleId;
    private Long driverId;
    private String driverName;
    private BigDecimal driverRating;
    private String vehicleNumber;
    private Short availableSeats;
    private OffsetDateTime departureTime;
    private double distanceToPickupMeters;
    private double detourPercent;
    private BigDecimal estimatedFare;
}
