package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUser(userId)));
    }

    @GetMapping("/organisation/{orgId}")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsersByOrg(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsersByOrganisation(orgId)));
    }
}
