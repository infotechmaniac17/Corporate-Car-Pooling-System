package com.carpooling.service;

import com.carpooling.entity.Transaction;

import java.math.BigDecimal;

public interface PaymentService {
    Transaction initiatePayment(Long rideId, BigDecimal amount, String paymentMethod);
    Transaction confirmPayment(String razorpayOrderId, String razorpayPaymentId);
    Transaction refund(Long transactionId);
}
