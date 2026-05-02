package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class VehicleRequest {
    @NotBlank
    private String vehicleNumber;

    @NotNull
    @Min(1)
    private Short capacity;
}
