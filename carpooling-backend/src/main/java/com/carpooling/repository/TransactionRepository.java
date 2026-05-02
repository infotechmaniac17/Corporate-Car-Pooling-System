package com.carpooling.repository;

import com.carpooling.entity.Transaction;
import com.carpooling.enums.TxnStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByRideScheduleId(Long rideScheduleId);
    Optional<Transaction> findByRazorpayOrderId(String razorpayOrderId);
    List<Transaction> findByRideScheduleIdAndStatus(Long rideScheduleId, TxnStatus status);
    List<Transaction> findByUserId(Long userId);
}
