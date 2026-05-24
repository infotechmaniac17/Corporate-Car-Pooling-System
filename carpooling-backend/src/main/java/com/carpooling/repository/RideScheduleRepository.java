package com.carpooling.repository;

import com.carpooling.entity.RideSchedule;
import com.carpooling.enums.GenderPreference;
import com.carpooling.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // status passed as param to avoid JPQL inline enum literal — required for @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Query("""
        SELECT rs FROM RideSchedule rs
        WHERE rs.status = :status
          AND rs.departureTime BETWEEN :from AND :to
          AND rs.availableSeats > 0
        """)
    List<RideSchedule> findAvailableSchedules(
            @Param("status") ScheduleStatus status,
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

    // dateStart/dateEnd always non-null: caller passes far-future when no date filter.
    // Avoids IS NULL on LocalDate param which fails with Hibernate 6 + named enum types.
    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver d
        JOIN FETCH rs.vehicle
        LEFT JOIN FETCH rs.route
        WHERE d.organisation.id = :orgId
          AND rs.status = :status
          AND rs.departureTime > :now
          AND rs.departureTime >= :dateStart
          AND rs.departureTime < :dateEnd
        ORDER BY rs.departureTime ASC
        """)
    List<RideSchedule> findOrgTripFeed(
            @Param("orgId") Long orgId,
            @Param("status") ScheduleStatus status,
            @Param("now") OffsetDateTime now,
            @Param("dateStart") OffsetDateTime dateStart,
            @Param("dateEnd") OffsetDateTime dateEnd);

    // departureDateStart/End always non-null. gender passed as param; anyGender flag skips gender filter.
    @Query("""
        SELECT rs FROM RideSchedule rs
        JOIN FETCH rs.driver
        JOIN FETCH rs.vehicle
        LEFT JOIN FETCH rs.route
        WHERE rs.status = :status
          AND (:driverName IS NULL OR LOWER(rs.driver.name) LIKE LOWER(CONCAT('%', :driverName, '%')))
          AND rs.departureTime >= :departureDateStart
          AND rs.departureTime < :departureDateEnd
          AND (:anyGender = true OR rs.genderPreference = :gender OR rs.genderPreference = :genderAny)
          AND (:availableSeats IS NULL OR rs.availableSeats >= :availableSeats)
        """)
    List<RideSchedule> searchSchedules(
            @Param("status") ScheduleStatus status,
            @Param("driverName") String driverName,
            @Param("departureDateStart") OffsetDateTime departureDateStart,
            @Param("departureDateEnd") OffsetDateTime departureDateEnd,
            @Param("availableSeats") Short availableSeats,
            @Param("gender") GenderPreference gender,
            @Param("genderAny") GenderPreference genderAny,
            @Param("anyGender") boolean anyGender);
}
