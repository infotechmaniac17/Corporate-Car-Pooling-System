package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data @Builder
public class OrganisationResponse {
    private Long id;
    private String name;
    private String domain;
    private OffsetDateTime createdAt;
}
