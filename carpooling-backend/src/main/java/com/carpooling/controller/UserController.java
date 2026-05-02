package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.service.RidePassengerService;
import com.carpooling.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RidePassengerService ridePassengerService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUser(userId)));
    }

    @GetMapping("/organisation/{orgId}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByOrg(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsersByOrganisation(orgId)));
    }

    @PatchMapping("/me/online")
    public ResponseEntity<ApiResponse<UserResponse>> toggleOnline(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(userService.toggleOnlineStatus(userId)));
    }

    @GetMapping("/me/rides")
    public ResponseEntity<ApiResponse<List<RidePassengerResponse>>> myRides(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(ridePassengerService.getRidesForPassenger(userId)));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        userService.softDeleteUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
