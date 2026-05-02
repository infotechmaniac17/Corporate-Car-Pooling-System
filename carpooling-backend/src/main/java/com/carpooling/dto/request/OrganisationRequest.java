package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrganisationRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String domain;
}
