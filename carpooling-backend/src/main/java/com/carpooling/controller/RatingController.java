package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.RatingRequest;
import com.carpooling.dto.response.RatingResponse;
import com.carpooling.entity.Rating;
import com.carpooling.service.RatingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<Rating>> submitRating(
            @Valid @RequestBody RatingRequest request,
            HttpServletRequest httpRequest) {
        Long givenById = extractUserId(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ratingService.submitRating(givenById, request)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getRatingsForUser(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(ratingService.getRatingsForUser(userId)));
    }

    @GetMapping("/my/given")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getMyGivenRatings(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(ratingService.getMyGivenRatings(userId)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
