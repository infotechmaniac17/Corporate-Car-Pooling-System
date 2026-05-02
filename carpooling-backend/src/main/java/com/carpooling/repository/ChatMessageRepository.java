package com.carpooling.repository;

import com.carpooling.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRideScheduleIdOrderByCreatedAtAsc(Long rideScheduleId);
    long countByRideScheduleIdAndIsReadFalseAndSenderIdNot(Long rideScheduleId, Long senderId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.rideSchedule.id = :rideId AND m.sender.id <> :userId AND m.isRead = false")
    int markAllReadForUser(@Param("rideId") Long rideId, @Param("userId") Long userId);
}
