package com.carpooling.repository;

import com.carpooling.entity.RideLocationPing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RideLocationPingRepository extends JpaRepository<RideLocationPing, Long> {

    @Query("SELECT p FROM RideLocationPing p WHERE p.rideSchedule.id = :rideId ORDER BY p.recordedAt DESC LIMIT 1")
    Optional<RideLocationPing> findLatestByRideId(@Param("rideId") Long rideId);

    void deleteByRideScheduleId(Long rideScheduleId);
}
