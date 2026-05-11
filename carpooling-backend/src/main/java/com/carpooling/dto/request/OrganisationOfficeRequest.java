package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganisationOfficeRequest {
    @NotBlank
    private String name;

    private String address;
    private Double lat;
    private Double lng;
    private Boolean isPrimary = false;
}
