package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder
public class RideScheduleResponse {
    private Long id;
    private Long driverId;
    private String driverName;
    private BigDecimal driverRating;
    private Long vehicleId;
    private String vehicleNumber;
    private Short vehicleCapacity;
    private Long routeId;
    private Double pickupLat;
    private Double pickupLng;
    private String pickupLabel;
    private Double dropoffLat;
    private Double dropoffLng;
    private String dropoffLabel;
    private BigDecimal fare;
    private OffsetDateTime departureTime;
    private Short availableSeats;
    private BigDecimal detourLimitPercent;
    private String status;
    private String genderPreference;
    private String cancelReason;
}
