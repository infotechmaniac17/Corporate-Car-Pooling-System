package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.response.TransactionResponse;
import com.carpooling.entity.Transaction;
import com.carpooling.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final JwtUtil jwtUtil;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<Transaction>> initiate(
            @RequestParam Long rideId,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMethod,
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.initiatePayment(rideId, userId, amount, paymentMethod)));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<Transaction>> confirm(
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.confirmPayment(razorpayOrderId, razorpayPaymentId)));
    }

    @PostMapping("/{transactionId}/refund")
    public ResponseEntity<ApiResponse<Transaction>> refund(
            @PathVariable Long transactionId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.refund(transactionId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> myTransactions(
            HttpServletRequest httpRequest) {
        Long userId = extractUserId(httpRequest);
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getMyTransactions(userId)));
    }
}
