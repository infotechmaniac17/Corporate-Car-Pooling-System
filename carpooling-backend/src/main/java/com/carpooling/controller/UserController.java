package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.UpdateUserRequest;
import com.carpooling.dto.response.ProfileStatsResponse;
import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.dto.response.UserActivityResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.entity.User;
import com.carpooling.enums.UserRole;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.RidePassengerService;
import com.carpooling.service.UserActivityService;
import com.carpooling.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RidePassengerService ridePassengerService;
    private final UserActivityService userActivityService;
    private final JwtUtil jwtUtil;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUser(userId)));
    }

    @GetMapping("/organisation/{orgId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByOrg(
            @PathVariable Long orgId,
            Authentication authentication) {
        User caller = userRepository.findByEmailAndIsDeletedFalse(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        if (caller.getRole() == UserRole.ADMIN) {
            if (!caller.getOrganisation().getId().equals(orgId)) {
                throw new BusinessException("Access denied", HttpStatus.FORBIDDEN);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsersByOrganisation(orgId)));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(userService.updateProfile(userId, request)));
    }

    @GetMapping("/me/profile-stats")
    public ResponseEntity<ApiResponse<ProfileStatsResponse>> profileStats(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfileStats(userId)));
    }

    @PatchMapping("/me/online")
    public ResponseEntity<ApiResponse<UserResponse>> toggleOnline(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(userService.toggleOnlineStatus(userId)));
    }

    @GetMapping("/me/activity")
    public ResponseEntity<ApiResponse<UserActivityResponse>> myActivity(HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(userActivityService.getActivity(userId)));
    }

    @GetMapping("/me/rides")
    public ResponseEntity<ApiResponse<List<RidePassengerResponse>>> myRides(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(ridePassengerService.getRidesForPassenger(userId)));
    }

    @PostMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> suspendUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.suspendUser(userId)));
    }

    @PostMapping("/{userId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> activateUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.activateUser(userId)));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long userId,
            HttpServletRequest httpRequest) {
        Long requesterId = extractUserId(httpRequest);
        if (!requesterId.equals(userId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Cannot delete another user's account"));
        }
        userService.softDeleteUser(userId);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
