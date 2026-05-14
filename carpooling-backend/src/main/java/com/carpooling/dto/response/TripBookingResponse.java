package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder
public class TripBookingResponse {
    private Long id;
    private Long tripId;
    private Long driverId;
    private String driverName;
    private Long passengerId;
    private String passengerName;
    private String vehicleNumber;
    private Double pickupLat;
    private Double pickupLng;
    private String pickupLabel;
    private Double dropoffLat;
    private Double dropoffLng;
    private String dropoffLabel;
    private BigDecimal fare;
    private OffsetDateTime departureTime;
    private String status;
    private String tripStatus;
    private OffsetDateTime createdAt;
}
