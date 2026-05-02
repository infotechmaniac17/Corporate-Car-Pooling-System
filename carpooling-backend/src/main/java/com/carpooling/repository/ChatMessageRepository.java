package com.carpooling.repository;

import com.carpooling.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRideScheduleIdOrderByCreatedAtAsc(Long rideScheduleId);
    long countByRideScheduleIdAndIsReadFalseAndSenderIdNot(Long rideScheduleId, Long senderId);
}
