package com.carpooling.service.impl;

import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.entity.GuardianContact;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.SosIncident;
import com.carpooling.entity.User;
import com.carpooling.enums.SosStatus;
import com.carpooling.repository.GuardianContactRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.SosIncidentRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.EmailService;
import com.carpooling.service.SosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SosServiceImpl implements SosService {

    private final SosIncidentRepository sosIncidentRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final GuardianContactRepository guardianContactRepository;
    private final EmailService emailService;

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

        notifyGuardians(user, lat, lng, rideId);

        return incident;
    }

    @Override
    public List<SosIncident> getIncidentsByRide(Long rideId) {
        return sosIncidentRepository.findByRideScheduleId(rideId);
    }

    @Override
    @Transactional
    public SosIncident resolveIncident(Long incidentId, Long resolvedByUserId) {
        SosIncident incident = sosIncidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("SosIncident", incidentId));
        User resolver = userRepository.findById(resolvedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", resolvedByUserId));
        incident.setStatus(SosStatus.RESOLVED);
        incident.setResolvedAt(OffsetDateTime.now());
        incident.setResolvedBy(resolver);
        return sosIncidentRepository.save(incident);
    }

    @Override
    public List<SosIncident> getAllActiveIncidents() {
        return sosIncidentRepository.findByStatusOrderByCreatedAtDesc(SosStatus.ACTIVE);
    }

    private void notifyGuardians(User triggeredBy, double lat, double lng, Long rideId) {
        List<GuardianContact> contacts = guardianContactRepository.findByUserId(triggeredBy.getId());
        contacts.forEach(contact -> {
            log.warn("SOS ALERT — Guardian: {} | Phone: {} | Location: {},{} | Ride: {}",
                    contact.getName(), contact.getPhone(), lat, lng, rideId);
            if (contact.getEmail() != null && !contact.getEmail().isBlank()) {
                emailService.sendSosAlert(contact.getEmail(), contact.getName(),
                        triggeredBy.getName(), lat, lng, rideId);
            }
        });
    }
}
