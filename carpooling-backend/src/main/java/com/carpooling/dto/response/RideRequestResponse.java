package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class RideRequestResponse {
    private Long id;
    private Long rideScheduleId;
    private Long passengerId;
    private String passengerName;
    private Double pickupLat;
    private Double pickupLng;
    private Double dropLat;
    private Double dropLng;
    private String status;
    private OffsetDateTime createdAt;

    // Ride snapshot for passenger view
    private Long driverId;
    private String driverName;
    private String vehicleNumber;
    private String pickupLabel;
    private String dropoffLabel;
    private OffsetDateTime departureTime;
    private java.math.BigDecimal fare;
    private String scheduleStatus;
}
