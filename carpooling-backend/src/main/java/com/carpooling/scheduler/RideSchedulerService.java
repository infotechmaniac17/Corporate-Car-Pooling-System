package com.carpooling.scheduler;

import com.carpooling.entity.RideRequest;
import com.carpooling.entity.RideSchedule;
import com.carpooling.enums.RequestStatus;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.BackupRideRepository;
import com.carpooling.repository.RideRequestRepository;
import com.carpooling.repository.RideScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideSchedulerService {

    private final RideRequestRepository rideRequestRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final BackupRideRepository backupRideRepository;

    /** Expire PENDING ride requests older than 24 hours. Runs every hour. */
    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void expireStaleRequests() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
        List<RideRequest> stale = rideRequestRepository.findByStatusAndCreatedAtBefore(RequestStatus.PENDING, cutoff);
        if (stale.isEmpty()) return;
        stale.forEach(r -> r.setStatus(RequestStatus.CANCELLED));
        rideRequestRepository.saveAll(stale);
        log.info("Expired {} stale ride requests", stale.size());
    }

    /**
     * Auto-complete rides that are still STARTED or ACTIVE 2 hours after their departure time.
     * Handles drivers who forget to end the ride. Runs every 30 minutes.
     */
    @Scheduled(fixedDelay = 1_800_000)
    @Transactional
    public void autoCompleteExpiredRides() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(2);
        List<RideSchedule> expired = rideScheduleRepository.findByStatusInAndDepartureTimeBefore(
                List.of(ScheduleStatus.STARTED, ScheduleStatus.ACTIVE), cutoff);
        if (expired.isEmpty()) return;
        expired.forEach(r -> r.setStatus(ScheduleStatus.COMPLETED));
        rideScheduleRepository.saveAll(expired);
        log.info("Auto-completed {} stale rides", expired.size());
    }

    /**
     * Expire PENDING backup offers for rides whose departure time has passed.
     * Runs every 30 minutes.
     */
    @Scheduled(fixedDelay = 1_800_000)
    @Transactional
    public void expirePendingBackups() {
        OffsetDateTime now = OffsetDateTime.now();
        int count = backupRideRepository.expirePendingBeforeDeparture(now);
        if (count > 0) log.info("Expired {} pending backup ride assignments", count);
    }
}
