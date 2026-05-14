package com.carpooling.dto.request;

import com.carpooling.enums.GenderPreference;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class PublishTripRequest {

    @NotNull
    private Long vehicleId;

    @NotNull private Double pickupLat;
    @NotNull private Double pickupLng;
    @NotBlank private String pickupLabel;

    @NotNull private Double dropoffLat;
    @NotNull private Double dropoffLng;
    @NotBlank private String dropoffLabel;

    @NotNull
    private OffsetDateTime departureTime;

    @NotNull @Min(1) @Max(8)
    private Short availableSeats;

    @NotNull @DecimalMin("0.0")
    private BigDecimal fare;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal detourLimitPercent;

    private GenderPreference genderPreference;

    // Informational: comma-separated day names e.g. "MON,WED,FRI"
    private String recurringDays;
}
