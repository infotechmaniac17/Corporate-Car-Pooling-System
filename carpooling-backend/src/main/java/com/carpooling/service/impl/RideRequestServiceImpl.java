package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.RideRequestDto;
import com.carpooling.entity.RideRequest;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.RequestStatus;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideRequestRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.RideRequestService;
import com.carpooling.service.UserActivityService;
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

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public RideRequest createRequest(Long passengerId, RideRequestDto dto) {
        RideSchedule schedule = rideScheduleRepository.findById(dto.getRideScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", dto.getRideScheduleId()));
        User passenger = userRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", passengerId));

        userActivityService.assertNoActiveSchedule(passengerId);

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

        return rideRequestRepository.save(RideRequest.builder()
                .rideSchedule(schedule)
                .passenger(passenger)
                .pickupLocation(pickup)
                .dropLocation(drop)
                .status(RequestStatus.PENDING)
                .build());
    }

    @Override
    @Transactional
    public RideRequest updateRequestStatus(Long requestId, Long driverId, RequestStatus newStatus) {
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

        return rideRequestRepository.save(request);
    }

    @Override
    public List<RideRequest> getRequestsForRide(Long rideId) {
        return rideRequestRepository.findByRideScheduleId(rideId);
    }

    @Override
    public List<RideRequest> getPassengerRequests(Long passengerId) {
        return rideRequestRepository.findByPassengerId(passengerId);
    }
}
