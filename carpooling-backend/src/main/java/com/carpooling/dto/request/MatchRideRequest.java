package com.carpooling.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class MatchRideRequest {
    @NotNull
    private Double pickupLat;

    @NotNull
    private Double pickupLng;

    @NotNull
    private Double dropLat;

    @NotNull
    private Double dropLng;

    @NotNull
    private OffsetDateTime desiredDepartureTime;

    private String genderPreference;

    private double searchRadiusMeters = 2000.0;
}
