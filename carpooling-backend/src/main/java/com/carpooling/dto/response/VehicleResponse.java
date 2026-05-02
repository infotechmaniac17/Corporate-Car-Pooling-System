package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class VehicleResponse {
    private Long id;
    private Long driverId;
    private String driverName;
    private String vehicleNumber;
    private Short capacity;
    private OffsetDateTime createdAt;
}
