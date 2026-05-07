package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.dto.response.RideScheduleResponse;
import com.carpooling.service.RidePassengerService;
import com.carpooling.service.RideScheduleService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripHistoryController {

    private final RidePassengerService ridePassengerService;
    private final RideScheduleService rideScheduleService;
    private final JwtUtil jwtUtil;

    @GetMapping("/passenger/my")
    public ResponseEntity<ApiResponse<List<RidePassengerResponse>>> myPassengerTrips(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(ridePassengerService.getRidesForPassenger(userId)));
    }

    @GetMapping("/driver/my")
    public ResponseEntity<ApiResponse<List<RideScheduleResponse>>> myDriverTrips(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(rideScheduleService.getDriverSchedules(userId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
