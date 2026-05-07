package com.carpooling.dto.request;

import lombok.Data;

@Data
public class UpdateUserRequest {
    // All fields optional — only present fields will be updated (PATCH semantics)
    private String name;
    private String phone;
    private String gender;

    // Address fields — all optional
    private String homeAddress;
    private Double homeLat;
    private Double homeLng;
    private String secondaryAddress;
    private Double secondaryLat;
    private Double secondaryLng;
}
