package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.entity.RoleRequest;
import com.carpooling.entity.User;
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

    @Override
    public void sendDriverApproval(User user, User admin, RoleRequest request) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(fromAddress, fromName));
            helper.setTo(user.getEmail());
            helper.setCc(admin.getEmail());
            helper.setSubject("Your driver verification has been approved – Waypoint");
            helper.setText(buildApprovalBody(user.getName(), request.getVehiclePlate()), true);
            mailSender.send(message);
            log.info("Driver approval email sent to {}", user.getEmail());
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            log.error("Failed to send approval email to {}: {}", user.getEmail(), ex.getMessage());
        }
    }

    @Override
    public void sendDriverRejection(User user, User admin, RoleRequest request, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(fromAddress, fromName));
            helper.setTo(user.getEmail());
            helper.setCc(admin.getEmail());
            helper.setSubject("Driver verification update – Waypoint");
            helper.setText(buildRejectionBody(user.getName(), request.getVehiclePlate(), reason), true);
            mailSender.send(message);
            log.info("Driver rejection email sent to {}", user.getEmail());
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            log.error("Failed to send rejection email to {}: {}", user.getEmail(), ex.getMessage());
        }
    }

    private String buildApprovalBody(String name, String plate) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
              <h2 style="margin:0 0 12px">Driver verification approved</h2>
              <p>Hi %s,</p>
              <p>Your driver application for vehicle <strong>%s</strong> has been approved.</p>
              <p>You can now log in to Waypoint and start offering rides to your colleagues.</p>
              <p style="font-size:13px;color:#555;margin-top:24px">— The Waypoint Team</p>
            </div>
            """.formatted(name, plate);
    }

    private String buildRejectionBody(String name, String plate, String reason) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
              <h2 style="margin:0 0 12px">Driver verification update</h2>
              <p>Hi %s,</p>
              <p>Your application for vehicle <strong>%s</strong> was not approved at this time.</p>
              <p><strong>Reason:</strong> %s</p>
              <p>You may resubmit with corrected documents. Your rider access is unaffected.</p>
              <p style="font-size:13px;color:#555;margin-top:24px">— The Waypoint Team</p>
            </div>
            """.formatted(name, plate, reason != null ? reason : "See admin note");
    }

    @Override
    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(new InternetAddress(fromAddress, fromName));
            helper.setTo(to);
            helper.setSubject("Reset your Waypoint password");
            helper.setText(buildPasswordResetBody(resetLink), true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (MailException | MessagingException | UnsupportedEncodingException ex) {
            log.error("Failed to send password reset email to {}: {}", to, ex.getMessage(), ex);
            throw new BusinessException("Could not send reset email. Please try again later.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private String buildPasswordResetBody(String resetLink) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
              <h2 style="margin:0 0 12px">Reset your password</h2>
              <p>We received a request to reset your Waypoint password. Click the button below to choose a new password.</p>
              <p style="margin:24px 0">
                <a href="%s" style="display:inline-block;padding:12px 28px;background:#1a1a2e;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Reset Password</a>
              </p>
              <p style="font-size:13px;color:#555">This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
              <p style="font-size:12px;color:#888;margin-top:16px">Or copy this link: <a href="%s" style="color:#555">%s</a></p>
            </div>
            """.formatted(resetLink, resetLink, resetLink);
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
