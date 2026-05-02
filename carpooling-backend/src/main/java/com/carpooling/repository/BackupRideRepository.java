package com.carpooling.repository;

import com.carpooling.entity.BackupRide;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BackupRideRepository extends JpaRepository<BackupRide, Long> {

    List<BackupRide> findByRideScheduleIdOrderByPriorityAsc(Long rideScheduleId);

    Optional<BackupRide> findTopByRideScheduleIdOrderByPriorityAsc(Long rideScheduleId);

    boolean existsByRideScheduleIdAndBackupDriverId(Long rideScheduleId, Long backupDriverId);

    void deleteByRideScheduleId(Long rideScheduleId);
}
