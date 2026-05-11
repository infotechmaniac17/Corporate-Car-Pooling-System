package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.response.PlatformStatsResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.service.OrganisationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/platform")
@RequiredArgsConstructor
public class PlatformController {

    private final OrganisationService organisationService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PlatformStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getPlatformStats()));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(
            @RequestParam(required = false) Long orgId,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getAllUsers(orgId, role)));
    }
}
