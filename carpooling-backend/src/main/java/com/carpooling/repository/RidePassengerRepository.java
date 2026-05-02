package com.carpooling.repository;

import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RidePassengerRepository extends JpaRepository<RidePassenger, Long> {
    List<RidePassenger> findByRideId(Long rideId);
    List<RidePassenger> findByPassengerId(Long passengerId);
    List<RidePassenger> findByRideIdAndStatus(Long rideId, PassengerStatus status);
    Optional<RidePassenger> findByRideIdAndPassengerId(Long rideId, Long passengerId);
    boolean existsByRideIdAndPassengerId(Long rideId, Long passengerId);
}
