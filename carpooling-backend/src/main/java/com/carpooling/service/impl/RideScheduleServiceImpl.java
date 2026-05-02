package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.CreateRideScheduleRequest;
import com.carpooling.dto.response.RideScheduleResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.Route;
import com.carpooling.entity.User;
import com.carpooling.entity.Vehicle;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.entity.RidePassenger;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.RouteRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.VehicleRepository;
import com.carpooling.service.RideScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RideScheduleServiceImpl implements RideScheduleService {

    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;
    private final RidePassengerRepository ridePassengerRepository;

    @Override
    @Transactional
    public RideScheduleResponse createSchedule(Long driverId, CreateRideScheduleRequest request) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", driverId));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", request.getVehicleId()));
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new ResourceNotFoundException("Route", request.getRouteId()));

        if (!vehicle.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Vehicle does not belong to this driver", HttpStatus.FORBIDDEN);
        }

        RideSchedule schedule = RideSchedule.builder()
                .driver(driver)
                .vehicle(vehicle)
                .route(route)
                .departureTime(request.getDepartureTime())
                .availableSeats(request.getAvailableSeats())
                .detourLimitPercent(request.getDetourLimitPercent())
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
        return rideScheduleRepository.findByDriverIdAndStatus(driverId, null)
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
    public void cancelSchedule(Long scheduleId, Long driverId, String reason) {
        RideSchedule schedule = getScheduleOrThrow(scheduleId);
        validateOwnership(schedule, driverId);
        if (schedule.getStatus() == ScheduleStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel completed ride");
        }
        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setCancelReason(reason);
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
        return RideScheduleResponse.builder()
                .id(s.getId())
                .driverId(s.getDriver().getId())
                .driverName(s.getDriver().getName())
                .driverRating(s.getDriver().getRating())
                .vehicleId(s.getVehicle().getId())
                .vehicleNumber(s.getVehicle().getVehicleNumber())
                .vehicleCapacity(s.getVehicle().getCapacity())
                .routeId(s.getRoute().getId())
                .departureTime(s.getDepartureTime())
                .availableSeats(s.getAvailableSeats())
                .detourLimitPercent(s.getDetourLimitPercent())
                .status(s.getStatus().name())
                .genderPreference(s.getGenderPreference() != null ? s.getGenderPreference().name() : null)
                .cancelReason(s.getCancelReason())
                .build();
    }
}
