package com.carpooling.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuardianContactRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String phone;
    @NotBlank
    private String relation;
}
