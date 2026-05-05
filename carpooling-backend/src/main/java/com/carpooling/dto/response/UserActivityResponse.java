package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserActivityResponse {
    private boolean hasOpenRequest;
    private boolean hasActiveSchedule;
    private boolean hasInProgressTrip;
}
