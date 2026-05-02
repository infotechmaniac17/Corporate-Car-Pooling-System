package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.request.AddWaypointRequest;
import com.carpooling.dto.response.RouteWaypointResponse;
import com.carpooling.service.RouteWaypointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/routes/{routeId}/waypoints")
@RequiredArgsConstructor
public class RouteWaypointController {

    private final RouteWaypointService routeWaypointService;

    @PostMapping
    public ResponseEntity<ApiResponse<RouteWaypointResponse>> addWaypoint(
            @PathVariable Long routeId,
            @Valid @RequestBody AddWaypointRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(routeWaypointService.addWaypoint(routeId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RouteWaypointResponse>>> getWaypoints(
            @PathVariable Long routeId) {
        return ResponseEntity.ok(ApiResponse.ok(routeWaypointService.getWaypointsForRoute(routeId)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteWaypoints(@PathVariable Long routeId) {
        routeWaypointService.deleteWaypointsForRoute(routeId);
        return ResponseEntity.ok(ApiResponse.ok("Waypoints deleted", null));
    }
}
