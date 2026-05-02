package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.entity.SosIncident;
import com.carpooling.service.SosService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;
    private final JwtUtil jwtUtil;

    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<SosIncident>> trigger(
            @RequestParam Long rideId,
            @RequestParam double lat,
            @RequestParam double lng,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(sosService.triggerSos(rideId, userId, lat, lng)));
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<List<SosIncident>>> getByRide(@PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(sosService.getIncidentsByRide(rideId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
