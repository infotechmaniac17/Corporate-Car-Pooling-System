package com.carpooling.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LocationPingRequest {
    @NotNull
    private Long rideId;

    @NotNull
    private Double lat;

    @NotNull
    private Double lng;
}
