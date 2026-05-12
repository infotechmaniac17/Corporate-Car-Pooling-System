package com.carpooling.repository;

import com.carpooling.entity.RideRequest;
import com.carpooling.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;

public interface RideRequestRepository extends JpaRepository<RideRequest, Long> {

    List<RideRequest> findByRideScheduleId(Long rideScheduleId);

    List<RideRequest> findByPassengerId(Long passengerId);

    List<RideRequest> findByRideScheduleIdAndStatus(Long rideScheduleId, RequestStatus status);

    List<RideRequest> findByRideScheduleIdAndStatusIn(Long rideScheduleId, Collection<RequestStatus> statuses);

    boolean existsByRideScheduleIdAndPassengerId(Long rideScheduleId, Long passengerId);

    boolean existsByPassengerIdAndStatusIn(Long passengerId, Collection<RequestStatus> statuses);

    @Query("SELECT r FROM RideRequest r WHERE r.rideSchedule.driver.id = :driverId ORDER BY r.createdAt DESC")
    List<RideRequest> findAllByDriverId(@Param("driverId") Long driverId);

    @Query("SELECT COUNT(r) FROM RideRequest r WHERE r.rideSchedule.id = :rideId AND r.status = 'ACCEPTED'")
    long countAcceptedByRideId(@Param("rideId") Long rideId);

    List<RideRequest> findByStatusAndCreatedAtBefore(RequestStatus status, java.time.OffsetDateTime before);

    @Query(value = """
        SELECT rr.* FROM ride_requests rr
        WHERE rr.ride_id = :rideId
          AND ST_DWithin(rr.pickup_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
        """, nativeQuery = true)
    List<RideRequest> findNearPickup(
            @Param("rideId") Long rideId,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMeters") double radiusMeters);
}
