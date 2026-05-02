package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.GuardianContactRequest;
import com.carpooling.dto.response.GuardianContactResponse;
import com.carpooling.service.GuardianContactService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users/me/guardians")
@RequiredArgsConstructor
public class GuardianContactController {

    private final GuardianContactService guardianContactService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<GuardianContactResponse>> addContact(
            @Valid @RequestBody GuardianContactRequest request,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(guardianContactService.addContact(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GuardianContactResponse>>> getContacts(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(guardianContactService.getContacts(userId)));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @PathVariable Long contactId,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        guardianContactService.deleteContact(contactId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Contact deleted", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
