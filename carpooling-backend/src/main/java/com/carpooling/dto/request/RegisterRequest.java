package com.carpooling.dto.request;

import com.carpooling.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 8)
    private String password;

    @NotBlank
    private String phone;

    @NotBlank
    private String gender;

    @NotNull
    private UserRole role;

    @NotNull
    private Long organisationId;

    @NotBlank
    @Size(min = 4, max = 8)
    private String otp;
}
