package com.carpooling.repository;

import com.carpooling.entity.SosIncident;
import com.carpooling.enums.SosStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SosIncidentRepository extends JpaRepository<SosIncident, Long> {
    List<SosIncident> findByRideScheduleId(Long rideScheduleId);
    List<SosIncident> findByTriggeredById(Long userId);
    List<SosIncident> findByStatusOrderByCreatedAtDesc(SosStatus status);
}
