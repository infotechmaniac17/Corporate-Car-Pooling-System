package com.carpooling.service;

public interface EmailVerificationService {

    /** Generates an OTP, persists its hash, and emails the code. */
    void sendOtp(String email);

    /** Validates an OTP against the latest record for the email; marks it verified on success. */
    void verifyOtp(String email, String otp);

    /**
     * Used during /auth/register: requires that {@link #verifyOtp} succeeded for this email
     * recently and the verification has not yet been consumed. Marks it consumed.
     */
    void consumeVerifiedOtp(String email);
}
