package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOrganisationRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String domain;

    private String officeAddress;
    private Double officeLat;
    private Double officeLng;
}
