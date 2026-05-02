package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.response.TransactionResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.Transaction;
import com.carpooling.entity.User;
import com.carpooling.enums.TxnStatus;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.TransactionRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.PaymentService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final TransactionRepository transactionRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Override
    @Transactional
    public Transaction initiatePayment(Long rideId, Long userId, BigDecimal amount, String paymentMethod) {
        RideSchedule schedule = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Transaction txn = transactionRepository.save(Transaction.builder()
                .rideSchedule(schedule)
                .user(user)
                .amount(amount)
                .status(TxnStatus.INITIATED)
                .paymentMethod(paymentMethod)
                .build());

        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // paise
            options.put("currency", "INR");
            options.put("receipt", "ride_" + rideId + "_txn_" + txn.getId());

            Order order = client.orders.create(options);
            txn.setRazorpayOrderId(order.get("id"));
            return transactionRepository.save(txn);
        } catch (Exception e) {
            log.error("Razorpay order creation failed for ride {}: {}", rideId, e.getMessage());
            txn.setStatus(TxnStatus.FAILED);
            transactionRepository.save(txn);
            throw new BusinessException("Payment initiation failed: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public Transaction confirmPayment(String razorpayOrderId, String razorpayPaymentId) {
        Transaction txn = transactionRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction for order: " + razorpayOrderId));
        txn.setRazorpayPaymentId(razorpayPaymentId);
        txn.setStatus(TxnStatus.SUCCESS);
        return transactionRepository.save(txn);
    }

    @Override
    @Transactional
    public Transaction refund(Long transactionId) {
        Transaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", transactionId));
        if (txn.getStatus() != TxnStatus.SUCCESS) {
            throw new BusinessException("Only successful transactions can be refunded");
        }
        txn.setStatus(TxnStatus.REFUNDED);
        return transactionRepository.save(txn);
    }

    @Override
    public List<TransactionResponse> getMyTransactions(Long userId) {
        return transactionRepository.findByUserId(userId)
                .stream().map(this::toResponse).toList();
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .rideId(t.getRideSchedule().getId())
                .userId(t.getUser() != null ? t.getUser().getId() : null)
                .amount(t.getAmount())
                .status(t.getStatus().name())
                .paymentMethod(t.getPaymentMethod())
                .razorpayOrderId(t.getRazorpayOrderId())
                .razorpayPaymentId(t.getRazorpayPaymentId())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
