package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.RideRequestDto;
import com.carpooling.dto.response.RideRequestResponse;
import com.carpooling.entity.RideEvent;
import com.carpooling.entity.RideRequest;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.RequestStatus;
import com.carpooling.enums.RideEventType;
import com.carpooling.repository.RideEventRepository;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideRequestRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.NotificationService;
import com.carpooling.service.RideRequestService;
import com.carpooling.service.UserActivityService;
import com.carpooling.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RideRequestServiceImpl implements RideRequestService {

    private final RideRequestRepository rideRequestRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final RidePassengerRepository ridePassengerRepository;
    private final UserActivityService userActivityService;
    private final RideEventRepository rideEventRepository;
    private final NotificationService notificationService;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public RideRequestResponse createRequest(Long passengerId, RideRequestDto dto) {
        RideSchedule schedule = rideScheduleRepository.findById(dto.getRideScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", dto.getRideScheduleId()));
        User passenger = userRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", passengerId));

        userActivityService.assertNoActiveSchedule(passengerId);
        userActivityService.assertNoOpenRequest(passengerId);

        if (schedule.getStatus() != ScheduleStatus.CREATED) {
            throw new BusinessException("Ride is not accepting requests");
        }
        if (schedule.getAvailableSeats() <= 0) {
            throw new BusinessException("No seats available");
        }
        if (rideRequestRepository.existsByRideScheduleIdAndPassengerId(dto.getRideScheduleId(), passengerId)) {
            throw new BusinessException("Already requested this ride");
        }

        Point pickup = GF.createPoint(new Coordinate(dto.getPickupLng(), dto.getPickupLat()));
        Point drop = GF.createPoint(new Coordinate(dto.getDropLng(), dto.getDropLat()));

        RideRequest saved = rideRequestRepository.save(RideRequest.builder()
                .rideSchedule(schedule)
                .passenger(passenger)
                .pickupLocation(pickup)
                .dropLocation(drop)
                .status(RequestStatus.PENDING)
                .build());

        notificationService.send(
                schedule.getDriver().getId(),
                "New ride request",
                passenger.getName() + " requested a seat on your ride",
                NotificationType.REQUEST_RECEIVED,
                schedule.getId());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public RideRequestResponse updateRequestStatus(Long requestId, Long driverId, RequestStatus newStatus) {
        RideRequest request = rideRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RideRequest", requestId));

        if (!request.getRideSchedule().getDriver().getId().equals(driverId)) {
            throw new BusinessException("Not authorized", HttpStatus.FORBIDDEN);
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Request already processed");
        }

        request.setStatus(newStatus);

        if (newStatus == RequestStatus.ACCEPTED) {
            RideSchedule schedule = request.getRideSchedule();
            if (schedule.getAvailableSeats() <= 0) {
                throw new BusinessException("No seats left");
            }
            schedule.setAvailableSeats((short) (schedule.getAvailableSeats() - 1));
            rideScheduleRepository.save(schedule);

            ridePassengerRepository.save(RidePassenger.builder()
                    .ride(schedule)
                    .passenger(request.getPassenger())
                    .status(PassengerStatus.ACTIVE)
                    .build());
        }

        RideRequestResponse resp = toResponse(rideRequestRepository.save(request));
        if (newStatus == RequestStatus.ACCEPTED || newStatus == RequestStatus.REJECTED) {
            RideEventType evtType = newStatus == RequestStatus.ACCEPTED
                    ? RideEventType.REQUEST_ACCEPTED : RideEventType.REQUEST_REJECTED;
            logEvent(request.getRideSchedule(), evtType, driverId,
                    "{\"requestId\":" + requestId + "}");

            Long passengerId = request.getPassenger().getId();
            Long rideId = request.getRideSchedule().getId();
            if (newStatus == RequestStatus.ACCEPTED) {
                notificationService.send(passengerId, "Ride request accepted",
                        "Your ride request was accepted. Check your trips.",
                        NotificationType.REQUEST_ACCEPTED, rideId);
            } else {
                notificationService.send(passengerId, "Ride request rejected",
                        "Your ride request was not accepted by the driver.",
                        NotificationType.REQUEST_REJECTED, rideId);
            }
        }
        return resp;
    }

    @Override
    @Transactional
    public RideRequestResponse cancelByPassenger(Long requestId, Long passengerId) {
        RideRequest request = rideRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RideRequest", requestId));

        if (!request.getPassenger().getId().equals(passengerId)) {
            throw new BusinessException("Not authorized to cancel this request", HttpStatus.FORBIDDEN);
        }
        if (request.getStatus() == RequestStatus.CANCELLED) {
            return toResponse(request);
        }
        if (request.getStatus() == RequestStatus.REJECTED) {
            throw new BusinessException("Request was rejected by driver");
        }

        if (request.getStatus() == RequestStatus.ACCEPTED) {
            RideSchedule schedule = request.getRideSchedule();
            if (schedule.getStatus() == ScheduleStatus.STARTED || schedule.getStatus() == ScheduleStatus.COMPLETED) {
                throw new BusinessException("Cannot cancel after ride has started");
            }
            schedule.setAvailableSeats((short) (schedule.getAvailableSeats() + 1));
            rideScheduleRepository.save(schedule);
            ridePassengerRepository.findByRideIdAndPassengerId(schedule.getId(), passengerId)
                    .ifPresent(rp -> {
                        rp.setStatus(PassengerStatus.CANCELLED);
                        ridePassengerRepository.save(rp);
                    });
        }

        request.setStatus(RequestStatus.CANCELLED);
        return toResponse(rideRequestRepository.save(request));
    }

    @Override
    public List<RideRequestResponse> getRequestsForRide(Long rideId) {
        return rideRequestRepository.findByRideScheduleId(rideId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<RideRequestResponse> getPassengerRequests(Long passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<RideRequestResponse> getRequestsForDriver(Long driverId) {
        return rideRequestRepository.findAllByDriverId(driverId)
                .stream().map(this::toResponse).toList();
    }

    private void logEvent(RideSchedule schedule, RideEventType type, Long actorId, String metadata) {
        rideEventRepository.save(RideEvent.builder()
                .rideSchedule(schedule)
                .eventType(type)
                .actor(actorId != null ? userRepository.getReferenceById(actorId) : null)
                .metadata(metadata)
                .build());
    }

    private RideRequestResponse toResponse(RideRequest r) {
        RideSchedule s = r.getRideSchedule();
        Point p = r.getPickupLocation();
        Point d = r.getDropLocation();
        return RideRequestResponse.builder()
                .id(r.getId())
                .rideScheduleId(s != null ? s.getId() : null)
                .passengerId(r.getPassenger() != null ? r.getPassenger().getId() : null)
                .passengerName(r.getPassenger() != null ? r.getPassenger().getName() : null)
                .pickupLat(p != null ? p.getY() : null)
                .pickupLng(p != null ? p.getX() : null)
                .dropLat(d != null ? d.getY() : null)
                .dropLng(d != null ? d.getX() : null)
                .status(r.getStatus() != null ? r.getStatus().name() : null)
                .createdAt(r.getCreatedAt())
                .driverId(s != null && s.getDriver() != null ? s.getDriver().getId() : null)
                .driverName(s != null && s.getDriver() != null ? s.getDriver().getName() : null)
                .vehicleNumber(s != null && s.getVehicle() != null ? s.getVehicle().getVehicleNumber() : null)
                .pickupLabel(s != null ? s.getPickupLabel() : null)
                .dropoffLabel(s != null ? s.getDropoffLabel() : null)
                .departureTime(s != null ? s.getDepartureTime() : null)
                .fare(s != null ? s.getFare() : null)
                .scheduleStatus(s != null && s.getStatus() != null ? s.getStatus().name() : null)
                .build();
    }
}
