package com.carpooling.service;

import com.carpooling.entity.BackupRide;

import java.util.List;

public interface BackupDriverService {
    void assignBackupDriver(Long rideId, Long backupDriverId, Short priority);
    void activateNextBackupDriver(Long rideId);
    List<BackupRide> getBackupDrivers(Long rideId);
}
