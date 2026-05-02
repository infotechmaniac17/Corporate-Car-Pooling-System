package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.LocationPingRequest;
import com.carpooling.entity.RideLocationPing;
import com.carpooling.service.TrackingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;
    private final JwtUtil jwtUtil;

    /**
     * WebSocket: driver sends pings via /app/track
     * Broadcast to /topic/ride/{rideId}/location
     */
    @MessageMapping("/track")
    public void receiveLocationPing(@Payload LocationPingRequest request) {
        trackingService.recordPing(request);
    }

    /**
     * REST fallback: POST /api/tracking/ping
     */
    @PostMapping("/tracking/ping")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>> pingRest(
            @Valid @RequestBody LocationPingRequest request) {
        trackingService.recordPing(request);
        return ResponseEntity.ok(ApiResponse.ok("Location recorded", null));
    }

    @GetMapping("/tracking/{rideId}/latest")
    @ResponseBody
    public ResponseEntity<ApiResponse<Map<String, Double>>> getLatest(@PathVariable Long rideId) {
        Optional<RideLocationPing> ping = trackingService.getLatestPing(rideId);
        return ping.map(p -> ResponseEntity.ok(ApiResponse.ok(Map.of(
                        "lat", p.getLocation().getY(),
                        "lng", p.getLocation().getX()))))
                .orElse(ResponseEntity.ok(ApiResponse.ok(null)));
    }
}
