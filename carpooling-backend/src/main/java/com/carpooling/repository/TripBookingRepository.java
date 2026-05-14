package com.carpooling.repository;

import com.carpooling.entity.TripBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TripBookingRepository extends JpaRepository<TripBooking, Long> {

    @Query("SELECT b FROM TripBooking b JOIN FETCH b.passenger JOIN FETCH b.rideSchedule WHERE b.rideSchedule.id = :scheduleId ORDER BY b.createdAt ASC")
    List<TripBooking> findByRideScheduleIdOrderByCreatedAtAsc(@Param("scheduleId") Long scheduleId);

    @Query("SELECT b FROM TripBooking b JOIN FETCH b.rideSchedule rs JOIN FETCH rs.driver JOIN FETCH rs.vehicle WHERE b.passenger.id = :passengerId ORDER BY b.createdAt DESC")
    List<TripBooking> findByPassengerIdOrderByCreatedAtDesc(@Param("passengerId") Long passengerId);

    Optional<TripBooking> findByRideScheduleIdAndPassengerId(Long rideScheduleId, Long passengerId);

    boolean existsByRideScheduleIdAndPassengerIdAndStatusNot(Long rideScheduleId, Long passengerId, String status);

    long countByRideScheduleIdAndStatus(Long rideScheduleId, String status);
}
