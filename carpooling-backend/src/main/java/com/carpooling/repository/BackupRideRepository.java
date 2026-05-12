package com.carpooling.repository;

import com.carpooling.entity.BackupRide;
import com.carpooling.enums.BackupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface BackupRideRepository extends JpaRepository<BackupRide, Long> {

    List<BackupRide> findByRideScheduleIdOrderByPriorityAsc(Long rideScheduleId);

    List<BackupRide> findByRideScheduleIdAndStatusOrderByPriorityAsc(Long rideScheduleId, BackupStatus status);

    Optional<BackupRide> findTopByRideScheduleIdAndStatusOrderByPriorityAsc(Long rideScheduleId, BackupStatus status);

    List<BackupRide> findByBackupDriverId(Long backupDriverId);

    boolean existsByRideScheduleIdAndBackupDriverId(Long rideScheduleId, Long backupDriverId);

    void deleteByRideScheduleId(Long rideScheduleId);

    @Modifying
    @Query("UPDATE BackupRide b SET b.status = 'EXPIRED' WHERE b.status = 'PENDING' AND b.rideSchedule.departureTime < :cutoff")
    int expirePendingBeforeDeparture(@Param("cutoff") OffsetDateTime cutoff);
}
