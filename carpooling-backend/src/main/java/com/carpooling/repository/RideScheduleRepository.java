package com.carpooling.repository;

import com.carpooling.entity.RideSchedule;
import com.carpooling.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

public interface RideScheduleRepository extends JpaRepository<RideSchedule, Long> {

    List<RideSchedule> findByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    boolean existsByDriverIdAndStatusIn(Long driverId, Collection<ScheduleStatus> statuses);

    boolean existsByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    List<RideSchedule> findByStatus(ScheduleStatus status);

    long countByDriverId(Long driverId);
    long countByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    @Query("""
        SELECT rs FROM RideSchedule rs
        WHERE rs.status = 'CREATED'
          AND rs.departureTime BETWEEN :from AND :to
          AND rs.availableSeats > 0
        """)
    List<RideSchedule> findAvailableSchedules(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver
        JOIN FETCH rs.vehicle
        JOIN FETCH rs.route
        WHERE rs.id = :id
        """)
    java.util.Optional<RideSchedule> findByIdWithDetails(@Param("id") Long id);
}
