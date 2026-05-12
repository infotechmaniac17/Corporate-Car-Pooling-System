package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.entity.BackupRide;
import com.carpooling.service.BackupDriverService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/driver/backup-rides")
@RequiredArgsConstructor
public class DriverBackupController {

    private final BackupDriverService backupDriverService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BackupRide>>> getMyBackupRides(HttpServletRequest request) {
        Long driverId = jwtUtil.extractUserId(request.getHeader("Authorization").substring(7));
        return ResponseEntity.ok(ApiResponse.ok(backupDriverService.getMyBackupRides(driverId)));
    }
}
