package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.config.JwtUtil;
import com.carpooling.entity.BackupRide;
import com.carpooling.entity.RideSchedule;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.service.BackupDriverService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/{rideId}/backup-drivers")
@RequiredArgsConstructor
public class BackupRideController {

    private final BackupDriverService backupDriverService;
    private final JwtUtil jwtUtil;
    private final RideScheduleRepository rideScheduleRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> assignBackup(
            @PathVariable Long rideId,
            @RequestParam Long backupDriverId,
            @RequestParam(defaultValue = "1") Short priority,
            HttpServletRequest httpRequest) {
        assertRideOwner(rideId, httpRequest);
        backupDriverService.assignBackupDriver(rideId, backupDriverId, priority);
        return ResponseEntity.ok(ApiResponse.ok("Backup driver assigned", null));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<BackupRide>>> getBackupDrivers(
            @PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(backupDriverService.getBackupDrivers(rideId)));
    }

    @PostMapping("/activate-next")
    public ResponseEntity<ApiResponse<Void>> activateNext(
            @PathVariable Long rideId,
            HttpServletRequest httpRequest) {
        assertRideOwner(rideId, httpRequest);
        backupDriverService.activateNextBackupDriver(rideId);
        return ResponseEntity.ok(ApiResponse.ok("Next backup driver activated", null));
    }

    private void assertRideOwner(Long rideId, HttpServletRequest httpRequest) {
        String token = httpRequest.getHeader("Authorization").substring(7);
        Long callerId = jwtUtil.extractUserId(token);
        RideSchedule schedule = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        if (!schedule.getDriver().getId().equals(callerId)) {
            throw new BusinessException("Access denied: you do not own this ride", HttpStatus.FORBIDDEN);
        }
    }
}
