package com.carpooling.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data @Builder
public class TransactionResponse {
    private Long id;
    private Long rideId;
    private Long userId;
    private BigDecimal amount;
    private String status;
    private String paymentMethod;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private OffsetDateTime createdAt;
}
