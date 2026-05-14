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
          AND rs.status = 'CREATED'
          AND rs.departureTime > :now
          AND (:date IS NULL OR rs.departureTime >= :dateStart AND rs.departureTime < :dateEnd)
        ORDER BY rs.departureTime ASC
        """)
    List<RideSchedule> findOrgTripFeed(
            @Param("orgId") Long orgId,
            @Param("now") OffsetDateTime now,
            @Param("date") LocalDate date,
            @Param("dateStart") OffsetDateTime dateStart,
            @Param("dateEnd") OffsetDateTime dateEnd);

    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver
        JOIN FETCH rs.vehicle
        LEFT JOIN FETCH rs.route
        WHERE rs.status = 'CREATED'
          AND (:driverName IS NULL OR LOWER(rs.driver.name) LIKE LOWER(CONCAT('%', :driverName, '%')))
          AND (:departureDateStart IS NULL OR rs.departureTime >= :departureDateStart AND rs.departureTime < :departureDateEnd)
          AND (:availableSeats IS NULL OR rs.availableSeats >= :availableSeats)
          AND (:gender IS NULL OR rs.genderPreference = :gender OR rs.genderPreference = 'ANY')
        """)
    List<RideSchedule> searchSchedules(
            @Param("driverName") String driverName,
            @Param("departureDateStart") OffsetDateTime departureDateStart,
            @Param("departureDateEnd") OffsetDateTime departureDateEnd,
            @Param("availableSeats") Short availableSeats,
            @Param("gender") com.carpooling.enums.GenderPreference gender);
}
