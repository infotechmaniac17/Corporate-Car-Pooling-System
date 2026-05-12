package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.LocationPingRequest;
import com.carpooling.entity.RideLocationPing;
import com.carpooling.entity.RideSchedule;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.RideLocationPingRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.service.TrackingService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrackingServiceImpl implements TrackingService {

    private final RideLocationPingRepository pingRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public void recordPing(LocationPingRequest request) {
        RideSchedule schedule = rideScheduleRepository.findById(request.getRideId())
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", request.getRideId()));

        if (schedule.getStatus() != ScheduleStatus.ACTIVE && schedule.getStatus() != ScheduleStatus.STARTED) {
            throw new BusinessException("Ride is not active or started");
        }

        Point location = GF.createPoint(new Coordinate(request.getLng(), request.getLat()));
        pingRepository.save(RideLocationPing.builder()
                .rideSchedule(schedule)
                .location(location)
                .build());

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/ride/" + request.getRideId() + "/location",
                new double[]{request.getLat(), request.getLng()});
    }

    @Override
    public Optional<RideLocationPing> getLatestPing(Long rideId) {
        return pingRepository.findLatestByRideId(rideId);
    }
}
