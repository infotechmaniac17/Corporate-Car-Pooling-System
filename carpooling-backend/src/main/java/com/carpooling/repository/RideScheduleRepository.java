package com.carpooling.repository;

import com.carpooling.entity.RideSchedule;
import com.carpooling.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RideScheduleRepository extends JpaRepository<RideSchedule, Long> {

    List<RideSchedule> findByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    List<RideSchedule> findByDriverIdOrderByDepartureTimeDesc(Long driverId);

    boolean existsByDriverIdAndStatusIn(Long driverId, Collection<ScheduleStatus> statuses);

    boolean existsByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    List<RideSchedule> findByStatus(ScheduleStatus status);

    long countByDriverId(Long driverId);
    long countByDriverIdAndStatus(Long driverId, ScheduleStatus status);

    List<RideSchedule> findByStatusInAndDepartureTimeBefore(
            java.util.Collection<ScheduleStatus> statuses, OffsetDateTime before);

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
        LEFT JOIN FETCH rs.route
        WHERE rs.id = :id
        """)
    Optional<RideSchedule> findByIdWithDetails(@Param("id") Long id);

    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver d
        JOIN FETCH rs.vehicle
        LEFT JOIN FETCH rs.route
        WHERE d.organisation.id = :orgId
          AND rs.status = com.carpooling.enums.ScheduleStatus.CREATED
          AND rs.departureTime > :now
          AND (:date IS NULL OR CAST(rs.departureTime AS date) = :date)
        ORDER BY rs.departureTime ASC
        """)
    List<RideSchedule> findOrgTripFeed(
            @Param("orgId") Long orgId,
            @Param("now") OffsetDateTime now,
            @Param("date") LocalDate date);

    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver
        JOIN FETCH rs.vehicle
        LEFT JOIN FETCH rs.route
        WHERE rs.status = com.carpooling.enums.ScheduleStatus.CREATED
          AND (:driverName IS NULL OR LOWER(rs.driver.name) LIKE LOWER(CONCAT('%', :driverName, '%')))
          AND (:departureDate IS NULL OR CAST(rs.departureTime AS date) = :departureDate)
          AND (:availableSeats IS NULL OR rs.availableSeats >= :availableSeats)
          AND (:gender IS NULL OR rs.genderPreference = :gender OR rs.genderPreference = com.carpooling.enums.GenderPreference.ANY)
        """)
    List<RideSchedule> searchSchedules(
            @Param("driverName") String driverName,
            @Param("departureDate") LocalDate departureDate,
            @Param("availableSeats") Short availableSeats,
            @Param("gender") com.carpooling.enums.GenderPreference gender);
}
