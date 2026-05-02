package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.entity.BackupRide;
import com.carpooling.service.BackupDriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/{rideId}/backup-drivers")
@RequiredArgsConstructor
public class BackupRideController {

    private final BackupDriverService backupDriverService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> assignBackup(
            @PathVariable Long rideId,
            @RequestParam Long backupDriverId,
            @RequestParam(defaultValue = "1") Short priority) {
        backupDriverService.assignBackupDriver(rideId, backupDriverId, priority);
        return ResponseEntity.ok(ApiResponse.ok("Backup driver assigned", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BackupRide>>> getBackupDrivers(
            @PathVariable Long rideId) {
        return ResponseEntity.ok(ApiResponse.ok(backupDriverService.getBackupDrivers(rideId)));
    }

    @PostMapping("/activate-next")
    public ResponseEntity<ApiResponse<Void>> activateNext(@PathVariable Long rideId) {
        backupDriverService.activateNextBackupDriver(rideId);
        return ResponseEntity.ok(ApiResponse.ok("Next backup driver activated", null));
    }
}
