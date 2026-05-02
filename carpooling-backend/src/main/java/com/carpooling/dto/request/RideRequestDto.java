package com.carpooling.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RideRequestDto {
    @NotNull
    private Long rideScheduleId;

    @NotNull
    private Double pickupLat;

    @NotNull
    private Double pickupLng;

    @NotNull
    private Double dropLat;

    @NotNull
    private Double dropLng;
}
