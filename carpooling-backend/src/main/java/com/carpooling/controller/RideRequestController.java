package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.RideRequestDto;
import com.carpooling.entity.RideRequest;
import com.carpooling.enums.RequestStatus;
import com.carpooling.service.RideRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/requests")
@RequiredArgsConstructor
public class RideRequestController {

    private final RideRequestService rideRequestService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<RideRequest>> createRequest(
            @Valid @RequestBody RideRequestDto dto,
            HttpServletRequest httpRequest) {
        Long passengerId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(rideRequestService.createRequest(passengerId, dto)));
    }

    @PatchMapping("/{requestId}/status")
    public ResponseEntity<ApiResponse<RideRequest>> updateStatus(
            @PathVariable Long requestId,
            @RequestParam RequestStatus status,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(
                rideRequestService.updateRequestStatus(requestId, driverId, status)));
    }

    @GetMapping("/ride/{rideId}")
    public ResponseEntity<ApiResponse<List<RideRequest>>> getRequestsForRide(
            @PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(rideRequestService.getRequestsForRide(rideId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<RideRequest>>> getMyRequests(
            HttpServletRequest httpRequest) {
        Long passengerId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(rideRequestService.getPassengerRequests(passengerId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
