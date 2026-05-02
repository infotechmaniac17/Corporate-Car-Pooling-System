package com.carpooling.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class CreateRideScheduleRequest {
    @NotNull
    private Long vehicleId;

    @NotNull
    private Long routeId;

    @NotNull @Future
    private OffsetDateTime departureTime;

    @NotNull @Min(1)
    private Short availableSeats;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal detourLimitPercent = BigDecimal.valueOf(20.00);
}
