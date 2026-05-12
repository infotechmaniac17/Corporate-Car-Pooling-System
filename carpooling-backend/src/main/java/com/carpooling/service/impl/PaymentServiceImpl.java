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
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    @Value("${razorpay.webhook-secret:}")
    private String razorpayWebhookSecret;

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
    public Transaction confirmPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        Transaction txn = transactionRepository.findByRazorpayOrderId(razorpayOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction for order: " + razorpayOrderId));

        // Verify the payment signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret)
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);
            boolean valid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            if (!valid) {
                throw new BusinessException("Payment signature verification failed", HttpStatus.BAD_REQUEST);
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Signature verification error for order {}: {}", razorpayOrderId, e.getMessage());
            throw new BusinessException("Payment signature verification failed", HttpStatus.BAD_REQUEST);
        }

        // Idempotent: if a webhook already confirmed it, just return.
        if (txn.getStatus() == TxnStatus.SUCCESS) {
            return txn;
        }
        if (txn.getStatus() == TxnStatus.REFUNDED) {
            throw new BusinessException("Transaction already refunded", HttpStatus.CONFLICT);
        }

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
        if (!StringUtils.hasText(txn.getRazorpayPaymentId())) {
            throw new BusinessException("Transaction has no Razorpay payment id to refund");
        }
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject request = new JSONObject();
            request.put("amount", txn.getAmount().multiply(BigDecimal.valueOf(100)).intValue()); // paise
            request.put("speed", "normal");
            client.payments.refund(txn.getRazorpayPaymentId(), request);
        } catch (Exception e) {
            log.error("Razorpay refund failed for txn {}: {}", transactionId, e.getMessage());
            throw new BusinessException("Refund failed: " + e.getMessage());
        }
        txn.setStatus(TxnStatus.REFUNDED);
        return transactionRepository.save(txn);
    }

    @Override
    @Transactional
    public void handleWebhook(String payload, String signature) {
        if (!StringUtils.hasText(razorpayWebhookSecret)) {
            log.warn("Razorpay webhook received but no webhook-secret configured — ignoring");
            return;
        }
        try {
            if (!Utils.verifyWebhookSignature(payload, signature, razorpayWebhookSecret)) {
                throw new BusinessException("Webhook signature verification failed", HttpStatus.BAD_REQUEST);
            }
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            throw new BusinessException("Webhook signature verification failed", HttpStatus.BAD_REQUEST);
        }

        JSONObject event = new JSONObject(payload);
        String eventType = event.optString("event");
        JSONObject paymentEntity = event
                .optJSONObject("payload") != null
                ? event.getJSONObject("payload").optJSONObject("payment") : null;
        if (paymentEntity == null) {
            log.info("Webhook {} has no payment entity — ignoring", eventType);
            return;
        }
        JSONObject payment = paymentEntity.optJSONObject("entity");
        if (payment == null) return;

        String orderId = payment.optString("order_id", null);
        String paymentId = payment.optString("id", null);
        if (orderId == null) return;

        transactionRepository.findByRazorpayOrderId(orderId).ifPresent(txn -> {
            switch (eventType) {
                case "payment.captured" -> {
                    if (txn.getStatus() != TxnStatus.REFUNDED) {
                        txn.setRazorpayPaymentId(paymentId);
                        txn.setStatus(TxnStatus.SUCCESS);
                        transactionRepository.save(txn);
                    }
                }
                case "payment.failed" -> {
                    if (txn.getStatus() == TxnStatus.INITIATED) {
                        txn.setStatus(TxnStatus.FAILED);
                        transactionRepository.save(txn);
                    }
                }
                case "refund.processed", "refund.created" -> {
                    txn.setStatus(TxnStatus.REFUNDED);
                    transactionRepository.save(txn);
                }
                default -> log.debug("Unhandled Razorpay webhook event: {}", eventType);
            }
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponse> getMyTransactions(Long userId) {
        return transactionRepository.findByUserId(userId)
                .stream().map(this::toResponse).toList();
    }

    private TransactionResponse toResponse(Transaction t) {
        RideSchedule schedule = t.getRideSchedule();
        String driverName = null;
        if (schedule != null && schedule.getDriver() != null) {
            driverName = schedule.getDriver().getName();
        }
        return TransactionResponse.builder()
                .id(t.getId())
                .rideId(schedule != null ? schedule.getId() : null)
                .userId(t.getUser() != null ? t.getUser().getId() : null)
                .amount(t.getAmount())
                .status(t.getStatus().name())
                .paymentMethod(t.getPaymentMethod())
                .razorpayOrderId(t.getRazorpayOrderId())
                .razorpayPaymentId(t.getRazorpayPaymentId())
                .createdAt(t.getCreatedAt())
                .pickupLabel(schedule != null ? schedule.getPickupLabel() : null)
                .dropoffLabel(schedule != null ? schedule.getDropoffLabel() : null)
                .driverName(driverName)
                .departureTime(schedule != null ? schedule.getDepartureTime() : null)
                .build();
    }
}
