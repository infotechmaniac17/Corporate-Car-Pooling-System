package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.entity.EmailVerification;
import com.carpooling.repository.EmailVerificationRepository;
import com.carpooling.service.EmailService;
import com.carpooling.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationRepository repository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${app.otp.expiry-minutes:10}")
    private int expiryMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.otp.cooldown-seconds:60}")
    private int cooldownSeconds;

    @Override
    @Transactional
    public void sendOtp(String email) {
        String normalised = normalise(email);

        repository.findTopByEmailOrderByCreatedAtDesc(normalised).ifPresent(prev -> {
            OffsetDateTime allowedAt = prev.getCreatedAt().plusSeconds(cooldownSeconds);
            if (OffsetDateTime.now().isBefore(allowedAt)) {
                long secs = java.time.Duration.between(OffsetDateTime.now(), allowedAt).getSeconds();
                throw new BusinessException("Please wait " + secs + "s before requesting another code.");
            }
        });

        String otp = generateOtp();
        EmailVerification record = EmailVerification.builder()
                .email(normalised)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(OffsetDateTime.now().plusMinutes(expiryMinutes))
                .attempts(0)
                .verified(false)
                .consumed(false)
                .build();
        repository.save(record);

        emailService.sendOtp(normalised, otp, expiryMinutes);
    }

    @Override
    @Transactional
    public void verifyOtp(String email, String otp) {
        String normalised = normalise(email);
        EmailVerification record = repository.findTopByEmailOrderByCreatedAtDesc(normalised)
                .orElseThrow(() -> new BusinessException("No verification code requested for this email."));

        if (Boolean.TRUE.equals(record.getConsumed())) {
            throw new BusinessException("This code has already been used. Please request a new one.");
        }
        if (record.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Verification code has expired. Please request a new one.");
        }
        if (record.getAttempts() >= maxAttempts) {
            throw new BusinessException("Too many attempts. Please request a new code.");
        }

        if (!passwordEncoder.matches(otp, record.getOtpHash())) {
            record.setAttempts(record.getAttempts() + 1);
            repository.save(record);
            throw new BusinessException("Invalid verification code.");
        }

        record.setVerified(true);
        repository.save(record);
    }

    @Override
    @Transactional
    public void consumeVerifiedOtp(String email) {
        String normalised = normalise(email);
        EmailVerification record = repository.findTopByEmailOrderByCreatedAtDesc(normalised)
                .orElseThrow(() -> new BusinessException("Email not verified. Please request a verification code."));

        if (!Boolean.TRUE.equals(record.getVerified())) {
            throw new BusinessException("Email not verified. Please verify your code before registering.");
        }
        if (Boolean.TRUE.equals(record.getConsumed())) {
            throw new BusinessException("Verification already used. Please request a new code.");
        }
        if (record.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Verification expired. Please request a new code.");
        }
        record.setConsumed(true);
        repository.save(record);
    }

    private String generateOtp() {
        StringBuilder sb = new StringBuilder(otpLength);
        for (int i = 0; i < otpLength; i++) sb.append(RANDOM.nextInt(10));
        return sb.toString();
    }

    private String normalise(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
