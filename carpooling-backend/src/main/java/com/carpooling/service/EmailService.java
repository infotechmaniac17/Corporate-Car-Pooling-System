package com.carpooling.service;

public interface EmailService {
    void sendOtp(String to, String otp, int expiryMinutes);
}
