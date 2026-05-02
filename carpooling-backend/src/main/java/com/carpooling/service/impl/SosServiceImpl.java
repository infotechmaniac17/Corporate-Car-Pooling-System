package com.carpooling.service.impl;

import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.entity.GuardianContact;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.SosIncident;
import com.carpooling.entity.User;
import com.carpooling.repository.GuardianContactRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.SosIncidentRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.SosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SosServiceImpl implements SosService {

    private final SosIncidentRepository sosIncidentRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final GuardianContactRepository guardianContactRepository;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public SosIncident triggerSos(Long rideId, Long userId, double lat, double lng) {
        RideSchedule schedule = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Point location = GF.createPoint(new Coordinate(lng, lat));
        SosIncident incident = sosIncidentRepository.save(SosIncident.builder()
                .rideSchedule(schedule)
                .triggeredBy(user)
                .location(location)
                .build());

        notifyGuardians(userId, lat, lng, rideId);

        return incident;
    }

    @Override
    public List<SosIncident> getIncidentsByRide(Long rideId) {
        return sosIncidentRepository.findByRideScheduleId(rideId);
    }

    private void notifyGuardians(Long userId, double lat, double lng, Long rideId) {
        List<GuardianContact> contacts = guardianContactRepository.findByUserId(userId);
        // Integration point: send SMS/push notification to each guardian
        // Example: notificationService.sendSosAlert(contact, lat, lng, rideId)
        contacts.forEach(contact ->
                log.warn("SOS ALERT — Guardian: {} | Phone: {} | Location: {},{} | Ride: {}",
                        contact.getName(), contact.getPhone(), lat, lng, rideId));
    }
}
