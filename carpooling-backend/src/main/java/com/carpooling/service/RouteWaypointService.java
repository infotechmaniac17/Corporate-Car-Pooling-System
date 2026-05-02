package com.carpooling.service;

import com.carpooling.dto.request.AddWaypointRequest;
import com.carpooling.dto.response.RouteWaypointResponse;

import java.util.List;

public interface RouteWaypointService {
    RouteWaypointResponse addWaypoint(Long routeId, AddWaypointRequest request);
    List<RouteWaypointResponse> getWaypointsForRoute(Long routeId);
    void deleteWaypointsForRoute(Long routeId);
}
