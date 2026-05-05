package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DriverRoleRequestDto {

    @NotBlank
    private String vehiclePlate;

    @NotBlank
    private String vehicleModel;

    @NotBlank
    private String vehicleType;

    @NotBlank
    private String vehicleFuel;

    @NotNull
    private Short vehicleSeats;

    @NotBlank
    private String licenseNumber;

    @NotNull
    private LocalDate licenseExpiry;

    @NotBlank
    private String idProofType;

    @NotBlank
    private String idProofNumber;

    @NotBlank
    private String rcNumber;

    @NotBlank
    private String insuranceNumber;

    @NotNull
    private LocalDate insuranceExpiry;
}
