package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.MatchRideRequest;
import com.carpooling.dto.response.MatchedRideResponse;
import com.carpooling.service.MatchingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rides/match")
@RequiredArgsConstructor
public class MatchingController {

    private final MatchingService matchingService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<List<MatchedRideResponse>>> findMatches(
            @Valid @RequestBody MatchRideRequest request,
            HttpServletRequest httpRequest) {
        Long passengerId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(
                matchingService.findMatchingRides(passengerId, request)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
