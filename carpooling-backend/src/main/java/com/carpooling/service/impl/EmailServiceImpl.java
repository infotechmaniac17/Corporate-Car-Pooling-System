package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromAddress;

    @Value("${app.email.from-name}")
    private String fromName;

    @Override
    public void sendOtp(String to, String otp, int expiryMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(fromAddress, fromName));
            helper.setTo(to);
            helper.setSubject("Your Waypoint verification code");
            helper.setText(buildBody(otp, expiryMinutes), true);
            mailSender.send(message);
            log.info("OTP email sent to {}", to);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            log.error("Failed to send OTP email to {}: {}", to, ex.getMessage(), ex);
            throw new BusinessException("Could not send verification email. Please try again later.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private String buildBody(String otp, int expiryMinutes) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
              <h2 style="margin:0 0 12px">Verify your email</h2>
              <p>Use the code below to finish creating your Waypoint account.</p>
              <p style="font-size:28px;font-weight:700;letter-spacing:6px;background:#f1f3f5;padding:14px 20px;border-radius:8px;text-align:center;margin:16px 0">%s</p>
              <p style="font-size:13px;color:#555">This code expires in %d minutes. If you did not request it, you can ignore this email.</p>
            </div>
            """.formatted(otp, expiryMinutes);
    }
}
