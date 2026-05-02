package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.entity.Transaction;
import com.carpooling.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<Transaction>> initiate(
            @RequestParam Long rideId,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMethod) {
        return ResponseEntity.ok(ApiResponse.ok(
                paymentService.initiatePayment(rideId, amount, paymentMethod)));
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
}
