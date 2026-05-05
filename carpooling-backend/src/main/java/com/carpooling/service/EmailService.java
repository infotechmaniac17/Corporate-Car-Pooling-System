package com.carpooling.service;

import com.carpooling.entity.RoleRequest;
import com.carpooling.entity.User;

public interface EmailService {
    void sendOtp(String to, String otp, int expiryMinutes);
    void sendDriverApproval(User user, User admin, RoleRequest request);
    void sendDriverRejection(User user, User admin, RoleRequest request, String reason);
    void sendPasswordResetEmail(String to, String resetLink);
}
