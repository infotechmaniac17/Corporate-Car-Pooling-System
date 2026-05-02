package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RouteWaypointResponse {
    private Long id;
    private Long routeId;
    private Double latitude;
    private Double longitude;
    private Integer sequence;
}
