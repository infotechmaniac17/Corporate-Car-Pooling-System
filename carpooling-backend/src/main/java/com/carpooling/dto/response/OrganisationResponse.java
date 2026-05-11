package com.carpooling.dto.response;

import com.carpooling.enums.OrganisationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class OrganisationResponse {
    private Long id;
    private String name;
    private String domain;
    private String officeAddress;
    private Double officeLat;
    private Double officeLng;
    private OrganisationStatus status;
    private OffsetDateTime createdAt;
}
