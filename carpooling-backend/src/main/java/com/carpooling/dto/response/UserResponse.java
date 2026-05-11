package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data @Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String gender;
    private String role;
    private BigDecimal rating;
    private Long organisationId;
    private String organisationName;
    private Boolean isOnline;
    private String driverStatus;
    private String passengerStatus;
    private String homeAddress;
    private Double homeLat;
    private Double homeLng;
    private String secondaryAddress;
    private Double secondaryLat;
    private Double secondaryLng;
    private Boolean isSuspended;
    private Long officeId;
    private String officeName;
}
