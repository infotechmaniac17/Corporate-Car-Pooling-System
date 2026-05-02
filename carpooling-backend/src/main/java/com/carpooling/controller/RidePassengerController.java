package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.service.RidePassengerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/{rideId}/passengers")
@RequiredArgsConstructor
public class RidePassengerController {

    private final RidePassengerService ridePassengerService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<RidePassengerResponse>> addPassenger(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ridePassengerService.addPassenger(rideId, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RidePassengerResponse>>> getPassengers(
            @PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(ridePassengerService.getPassengersForRide(rideId)));
    }

    @PatchMapping("/status")
    public ResponseEntity<ApiResponse<RidePassengerResponse>> updateStatus(
            @PathVariable Long rideId,
            @RequestParam PassengerStatus status,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(ridePassengerService.updateStatus(rideId, userId, status)));
    }

    @PostMapping("/complete-all")
    public ResponseEntity<ApiResponse<Void>> completeAll(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        ridePassengerService.completeAllPassengers(rideId, driverId);
        return ResponseEntity.ok(ApiResponse.ok("All passengers marked completed", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
