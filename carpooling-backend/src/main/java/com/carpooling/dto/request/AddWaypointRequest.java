package com.carpooling.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddWaypointRequest {
    @NotNull
    private Double latitude;
    @NotNull
    private Double longitude;
    @NotNull
    private Integer sequence;
}
