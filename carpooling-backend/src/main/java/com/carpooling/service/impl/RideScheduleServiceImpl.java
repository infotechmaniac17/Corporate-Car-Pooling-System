package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.CancelScheduleRequest;
import com.carpooling.dto.request.CreateRideScheduleRequest;
import com.carpooling.dto.response.RideScheduleResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.Route;
import com.carpooling.entity.User;
import com.carpooling.entity.Vehicle;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.RouteRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.VehicleRepository;
import com.carpooling.service.RideScheduleService;
import com.carpooling.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RideScheduleServiceImpl implements RideScheduleService {

    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final RidePassengerRepository ridePassengerRepository;
    private final UserActivityService userActivityService;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public RideScheduleResponse createSchedule(Long driverId, CreateRideScheduleRequest request) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", driverId));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));

        if (!vehicle.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Vehicle does not belong to this driver", HttpStatus.FORBIDDEN);
        }

        userActivityService.assertNoOpenRequest(driverId);

        Point pickup = GF.createPoint(new Coordinate(request.getPickupLng(), request.getPickupLat()));
        Point dropoff = GF.createPoint(new Coordinate(request.getDropoffLng(), request.getDropoffLat()));

        BigDecimal detour = request.getDetourLimitPercent() != null
                ? request.getDetourLimitPercent()
                : BigDecimal.valueOf(20.00);

        RideSchedule schedule = RideSchedule.builder()
                .driver(driver)
                .vehicle(vehicle)
                .pickupLocation(pickup)
                .pickupLabel(request.getPickupLabel())
                .dropoffLocation(dropoff)
                .dropoffLabel(request.getDropoffLabel())
                .fare(request.getFare())
                .departureTime(request.getDepartureTime())
                .availableSeats(request.getAvailableSeats())
                .detourLimitPercent(detour)
                .genderPreference(request.getGenderPreference())
                .status(ScheduleStatus.CREATED)
                .build();

        return toResponse(rideScheduleRepository.save(schedule));
    }

    @Override
    public RideScheduleResponse getSchedule(Long scheduleId) {
        return rideScheduleRepository.findByIdWithDetails(scheduleId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", scheduleId));
    }

    @Override
    public List<RideScheduleResponse> getDriverSchedules(Long driverId) {
        return rideScheduleRepository.findByDriverIdOrderByDepartureTimeDesc(driverId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public RideScheduleResponse updateStatus(Long scheduleId, Long driverId, ScheduleStatus newStatus) {
        RideSchedule schedule = getScheduleOrThrow(scheduleId);
        validateOwnership(schedule, driverId);
        validateTransition(schedule.getStatus(), newStatus);
        schedule.setStatus(newStatus);
        RideSchedule saved = rideScheduleRepository.save(schedule);

        if (newStatus == ScheduleStatus.COMPLETED) {
            ridePassengerRepository.findByRideIdAndStatus(scheduleId, PassengerStatus.ACTIVE)
                    .forEach(rp -> {
                        rp.setStatus(PassengerStatus.COMPLETED);
                        ridePassengerRepository.save(rp);
                    });
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancelSchedule(Long scheduleId, Long driverId, CancelScheduleRequest req) {
        RideSchedule schedule = getScheduleOrThrow(scheduleId);
        validateOwnership(schedule, driverId);
        if (schedule.getStatus() == ScheduleStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel completed ride");
        }
        schedule.setStatus(ScheduleStatus.CANCELLED);
        String reasonText = req.getReasonCode().name();
        if (req.getNote() != null && !req.getNote().isBlank()) {
            reasonText = reasonText + ": " + req.getNote().trim();
        }
        schedule.setCancelReason(reasonText);
        rideScheduleRepository.save(schedule);

        ridePassengerRepository.findByRideIdAndStatus(scheduleId, PassengerStatus.ACTIVE)
                .forEach(rp -> {
                    rp.setStatus(PassengerStatus.CANCELLED);
                    ridePassengerRepository.save(rp);
                });
    }

    private RideSchedule getScheduleOrThrow(Long id) {
        return rideScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", id));
    }

    private void validateOwnership(RideSchedule schedule, Long driverId) {
        if (!schedule.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Not authorized for this ride", HttpStatus.FORBIDDEN);
        }
    }

    private void validateTransition(ScheduleStatus current, ScheduleStatus next) {
        boolean valid = switch (current) {
            case CREATED -> next == ScheduleStatus.ACTIVE || next == ScheduleStatus.CANCELLED;
            case ACTIVE  -> next == ScheduleStatus.STARTED || next == ScheduleStatus.CANCELLED;
            case STARTED -> next == ScheduleStatus.COMPLETED || next == ScheduleStatus.CANCELLED;
            default -> false;
        };
        if (!valid) {
            throw new BusinessException("Invalid status transition: " + current + " -> " + next);
        }
    }

    private RideScheduleResponse toResponse(RideSchedule s) {
        Point pickup = s.getPickupLocation();
        Point dropoff = s.getDropoffLocation();
        return RideScheduleResponse.builder()
                .id(s.getId())
                .driverId(s.getDriver().getId())
                .driverName(s.getDriver().getName())
                .driverRating(s.getDriver().getRating())
                .vehicleId(s.getVehicle().getId())
                .vehicleNumber(s.getVehicle().getVehicleNumber())
                .vehicleCapacity(s.getVehicle().getCapacity())
                .routeId(s.getRoute() != null ? s.getRoute().getId() : null)
                .pickupLat(pickup != null ? pickup.getY() : null)
                .pickupLng(pickup != null ? pickup.getX() : null)
                .pickupLabel(s.getPickupLabel())
                .dropoffLat(dropoff != null ? dropoff.getY() : null)
                .dropoffLng(dropoff != null ? dropoff.getX() : null)
                .dropoffLabel(s.getDropoffLabel())
                .fare(s.getFare())
                .departureTime(s.getDepartureTime())
                .availableSeats(s.getAvailableSeats())
                .detourLimitPercent(s.getDetourLimitPercent())
                .status(s.getStatus().name())
                .genderPreference(s.getGenderPreference() != null ? s.getGenderPreference().name() : null)
                .cancelReason(s.getCancelReason())
                .build();
    }
}
