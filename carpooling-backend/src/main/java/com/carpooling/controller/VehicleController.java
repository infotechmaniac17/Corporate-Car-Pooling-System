package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.VehicleRequest;
import com.carpooling.dto.response.VehicleResponse;
import com.carpooling.service.VehicleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<VehicleResponse>> register(
            @Valid @RequestBody VehicleRequest request,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(vehicleService.registerVehicle(driverId, request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> myVehicles(
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getMyVehicles(driverId)));
    }

    @GetMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicle(
            @PathVariable Long vehicleId) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getVehicle(vehicleId)));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(
            @PathVariable Long vehicleId,
            HttpServletRequest httpRequest) {
        Long driverId = extractUserId(httpRequest);
        vehicleService.deleteVehicle(vehicleId, driverId);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle deleted", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
