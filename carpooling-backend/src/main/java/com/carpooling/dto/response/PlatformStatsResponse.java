package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PlatformStatsResponse {
    private long totalOrgs;
    private long activeOrgs;
    private long pendingOrgs;
    private long suspendedOrgs;
    private long totalUsers;
    private long totalAdmins;
}
