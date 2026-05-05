package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data @Builder
public class RoleRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String vehiclePlate;
    private String vehicleModel;
    private String vehicleType;
    private String vehicleFuel;
    private Short vehicleSeats;
    private String licenseNumber;
    private LocalDate licenseExpiry;
    private String licenseDocUrl;
    private String idProofType;
    private String idProofNumber;
    private String idProofDocUrl;
    private String rcNumber;
    private String rcDocUrl;
    private String insuranceNumber;
    private LocalDate insuranceExpiry;
    private String insuranceDocUrl;
    private String status;
    private String adminNote;
    private OffsetDateTime submittedAt;
    private OffsetDateTime decidedAt;
}
