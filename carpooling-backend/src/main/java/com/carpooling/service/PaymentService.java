package com.carpooling.service;

import com.carpooling.dto.response.TransactionResponse;
import com.carpooling.entity.Transaction;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {
    Transaction initiatePayment(Long rideId, Long userId, BigDecimal amount, String paymentMethod);
    Transaction confirmPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature);
    Transaction refund(Long transactionId);
    List<TransactionResponse> getMyTransactions(Long userId);
    void handleWebhook(String payload, String signature);
}
