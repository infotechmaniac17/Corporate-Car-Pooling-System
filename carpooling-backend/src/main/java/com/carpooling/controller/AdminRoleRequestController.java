package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.response.RoleRequestResponse;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.service.RoleRequestService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/role-requests")
@RequiredArgsConstructor
public class AdminRoleRequestController {

    private final RoleRequestService roleRequestService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleRequestResponse>>> listByStatus(
            @RequestParam(defaultValue = "PENDING") String status) {
        VerificationStatus vs = VerificationStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok(roleRequestService.listByStatus(vs)));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<RoleRequestResponse>> approve(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        Long adminId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(roleRequestService.approve(id, adminId)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<RoleRequestResponse>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        Long adminId = extractUserId(httpRequest);
        String reason = body.getOrDefault("reason", "");
        return ResponseEntity.ok(ApiResponse.ok(roleRequestService.reject(id, adminId, reason)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
