package com.carpooling.service;

import com.carpooling.dto.request.LoginRequest;
import com.carpooling.dto.request.RegisterRequest;
import com.carpooling.dto.response.AuthResponse;
import com.carpooling.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse selectRole(Long userId, String selectedRole);
    UserResponse getUser(Long userId);
    List<UserResponse> getUsersByOrganisation(Long organisationId);
    UserResponse toggleOnlineStatus(Long userId);
    void softDeleteUser(Long userId);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
}
