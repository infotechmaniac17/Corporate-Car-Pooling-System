package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProfileStatsResponse {
    // passenger stats
    private long totalRidesTaken;
    private long completedRidesAsPassenger;
    private long cancelledRidesAsPassenger;

    // driver stats
    private long totalRidesOffered;
    private long completedRidesAsDriver;
    private long cancelledRidesAsDriver;
    private long totalPassengersServed;
}
