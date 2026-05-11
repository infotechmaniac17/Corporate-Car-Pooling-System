package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class OrgStatsResponse {
    private Long orgId;
    private long totalEmployees;
    private long totalAdmins;
    private long totalOffices;
}
