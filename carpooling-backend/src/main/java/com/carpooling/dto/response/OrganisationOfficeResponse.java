package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class OrganisationOfficeResponse {
    private Long id;
    private Long organisationId;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private Boolean isPrimary;
    private long userCount;
    private OffsetDateTime createdAt;
}
