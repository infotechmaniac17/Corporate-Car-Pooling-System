package com.carpooling.repository;

import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RidePassengerRepository extends JpaRepository<RidePassenger, Long> {
    List<RidePassenger> findByRideId(Long rideId);
    List<RidePassenger> findByPassengerId(Long passengerId);
    List<RidePassenger> findByRideIdAndStatus(Long rideId, PassengerStatus status);
    Optional<RidePassenger> findByRideIdAndPassengerId(Long rideId, Long passengerId);
    boolean existsByRideIdAndPassengerId(Long rideId, Long passengerId);

    long countByPassengerId(Long passengerId);
    long countByPassengerIdAndStatus(Long passengerId, PassengerStatus status);

    @Query("SELECT COUNT(rp) FROM RidePassenger rp WHERE rp.ride.driver.id = :driverId AND rp.ride.status = 'COMPLETED' AND rp.status <> 'CANCELLED'")
    long countPassengersServedByDriver(@Param("driverId") Long driverId);
}
