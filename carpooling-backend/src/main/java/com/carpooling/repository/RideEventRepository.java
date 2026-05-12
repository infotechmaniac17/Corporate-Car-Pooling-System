package com.carpooling.repository;

import com.carpooling.entity.RideEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RideEventRepository extends JpaRepository<RideEvent, Long> {
    List<RideEvent> findByRideScheduleIdOrderByCreatedAtAsc(Long rideScheduleId);
}
