package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.entity.BackupRide;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.BackupRideRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.BackupDriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BackupDriverServiceImpl implements BackupDriverService {

    private final BackupRideRepository backupRideRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void assignBackupDriver(Long rideId, Long backupDriverId, Short priority) {
        RideSchedule schedule = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        User backupDriver = userRepository.findById(backupDriverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", backupDriverId));

        if (backupRideRepository.existsByRideScheduleIdAndBackupDriverId(rideId, backupDriverId)) {
            throw new BusinessException("Driver already assigned as backup for this ride");
        }
        if (backupDriver.getId().equals(schedule.getDriver().getId())) {
            throw new BusinessException("Primary driver cannot be a backup driver");
        }

        backupRideRepository.save(BackupRide.builder()
                .rideSchedule(schedule)
                .backupDriver(backupDriver)
                .priority(priority)
                .build());
    }

    @Override
    @Transactional
    public void activateNextBackupDriver(Long rideId) {
        RideSchedule schedule = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));

        BackupRide next = backupRideRepository.findTopByRideScheduleIdOrderByPriorityAsc(rideId)
                .orElseThrow(() -> new BusinessException("No backup driver available for ride: " + rideId));

        // Promote backup driver to primary
        schedule.setDriver(next.getBackupDriver());
        schedule.setStatus(ScheduleStatus.ACTIVE);
        rideScheduleRepository.save(schedule);

        // Remove activated backup from the list
        backupRideRepository.delete(next);
    }

    @Override
    public List<BackupRide> getBackupDrivers(Long rideId) {
        return backupRideRepository.findByRideScheduleIdOrderByPriorityAsc(rideId);
    }
}
