package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.CreateRideScheduleRequest;
import com.carpooling.dto.response.RideScheduleResponse;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.service.RideScheduleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/schedules")
@RequiredArgsConstructor
public class RideScheduleController {

    private final RideScheduleService rideScheduleService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<RideScheduleResponse>> createSchedule(
            @Valid @RequestBody CreateRideScheduleRequest request,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(rideScheduleService.createSchedule(driverId, request)));
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<RideScheduleResponse>> getSchedule(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(ApiResponse.ok(rideScheduleService.getSchedule(scheduleId)));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<ApiResponse<List<RideScheduleResponse>>> getDriverSchedules(
            @PathVariable Long driverId) {
        return ResponseEntity.ok(ApiResponse.ok(rideScheduleService.getDriverSchedules(driverId)));
    }

    @PatchMapping("/{scheduleId}/status")
    public ResponseEntity<ApiResponse<RideScheduleResponse>> updateStatus(
            @PathVariable Long scheduleId,
            @RequestParam ScheduleStatus status,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(
                rideScheduleService.updateStatus(scheduleId, driverId, status)));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> cancelSchedule(
            @PathVariable Long scheduleId,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        rideScheduleService.cancelSchedule(scheduleId, driverId, reason);
        return ResponseEntity.ok(ApiResponse.ok("Schedule cancelled", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
