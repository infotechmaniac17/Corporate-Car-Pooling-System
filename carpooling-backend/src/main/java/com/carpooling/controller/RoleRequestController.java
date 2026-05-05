package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.DriverRoleRequestDto;
import com.carpooling.dto.response.RoleRequestResponse;
import com.carpooling.service.RoleRequestService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/role-requests")
@RequiredArgsConstructor
public class RoleRequestController {

    private final RoleRequestService roleRequestService;
    private final JwtUtil jwtUtil;

    @PostMapping(value = "/driver", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<RoleRequestResponse>> submitDriverRequest(
            @RequestPart("data") @Valid DriverRoleRequestDto dto,
            @RequestPart("licenseDoc") MultipartFile licenseDoc,
            @RequestPart("idProofDoc") MultipartFile idProofDoc,
            @RequestPart("rcDoc") MultipartFile rcDoc,
            @RequestPart("insuranceDoc") MultipartFile insuranceDoc,
            HttpServletRequest httpRequest) {

        Long userId = extractUserId(httpRequest);
        RoleRequestResponse response = roleRequestService.submitDriverRequest(
                userId, dto, licenseDoc, idProofDoc, rcDoc, insuranceDoc);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Driver request submitted", response));
    }

    @PostMapping("/passenger")
    public ResponseEntity<ApiResponse<Void>> submitPassengerRequest(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        roleRequestService.submitPassengerRequest(userId);
        return ResponseEntity.ok(ApiResponse.ok("Rider access enabled", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<RoleRequestResponse>>> getMyRequests(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(roleRequestService.getMyRequests(userId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
