package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.request.LoginRequest;
import com.carpooling.dto.request.RegisterRequest;
import com.carpooling.dto.request.SendOtpRequest;
import com.carpooling.dto.request.VerifyOtpRequest;
import com.carpooling.dto.response.AuthResponse;
import com.carpooling.service.EmailVerificationService;
import com.carpooling.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final EmailVerificationService emailVerificationService;

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
}
