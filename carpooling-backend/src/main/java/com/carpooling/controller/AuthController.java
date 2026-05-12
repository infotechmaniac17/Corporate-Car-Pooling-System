package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.ForgotPasswordRequest;
import com.carpooling.dto.request.LoginRequest;
import com.carpooling.dto.request.RegisterRequest;
import com.carpooling.dto.request.ResetPasswordRequest;
import com.carpooling.dto.request.SendOtpRequest;
import com.carpooling.dto.request.VerifyOtpRequest;
import com.carpooling.dto.response.AuthResponse;
import com.carpooling.entity.RefreshToken;
import com.carpooling.entity.User;
import com.carpooling.service.EmailVerificationService;
import com.carpooling.service.RefreshTokenService;
import com.carpooling.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final EmailVerificationService emailVerificationService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        emailVerificationService.sendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Verification code sent", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        emailVerificationService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Email verified", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(userService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(userService.login(request)));
    }

    @PostMapping("/select-role")
    public ResponseEntity<ApiResponse<AuthResponse>> selectRole(
            @RequestParam Long userId,
            @RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.ok(userService.selectRole(userId, role)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Password reset link sent to your email", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(@RequestParam String refreshToken) {
        RefreshToken rt = refreshTokenService.verifyRefreshToken(refreshToken);
        User user = rt.getUser();
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        RefreshToken newRt = refreshTokenService.createRefreshToken(user);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "token", newAccessToken,
                "refreshToken", newRt.getToken()
        )));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestParam String refreshToken) {
        try {
            RefreshToken rt = refreshTokenService.verifyRefreshToken(refreshToken);
            refreshTokenService.revokeByUser(rt.getUser());
        } catch (Exception ignored) {}
        return ResponseEntity.ok(ApiResponse.ok("Logged out", null));
    }
}
