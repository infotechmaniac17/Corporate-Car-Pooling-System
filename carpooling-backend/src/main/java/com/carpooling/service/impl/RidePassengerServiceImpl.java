package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.entity.RidePassenger;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.PassengerStatus;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.repository.RidePassengerRepository;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.RidePassengerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RidePassengerServiceImpl implements RidePassengerService {

    private final RidePassengerRepository ridePassengerRepository;
    private final RideScheduleRepository rideScheduleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public RidePassengerResponse addPassenger(Long rideId, Long passengerId) {
        RideSchedule ride = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        User passenger = userRepository.findById(passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", passengerId));

        if (ride.getStatus() != ScheduleStatus.ACTIVE && ride.getStatus() != ScheduleStatus.STARTED) {
            throw new BusinessException("Can only join active or started rides");
        }
        if (ridePassengerRepository.existsByRideIdAndPassengerId(rideId, passengerId)) {
            throw new BusinessException("Passenger already on this ride");
        }
        if (ride.getAvailableSeats() <= 0) {
            throw new BusinessException("No seats available");
        }

        RidePassenger rp = ridePassengerRepository.save(RidePassenger.builder()
                .ride(ride)
                .passenger(passenger)
                .status(PassengerStatus.ACTIVE)
                .build());

        ride.setAvailableSeats((short) (ride.getAvailableSeats() - 1));
        rideScheduleRepository.save(ride);

        return toResponse(rp);
    }

    @Override
    @Transactional
    public RidePassengerResponse updateStatus(Long rideId, Long passengerId, PassengerStatus status) {
        RidePassenger rp = ridePassengerRepository.findByRideIdAndPassengerId(rideId, passengerId)
                .orElseThrow(() -> new ResourceNotFoundException("RidePassenger not found for ride/passenger"));

        PassengerStatus current = rp.getStatus();
        if (current == PassengerStatus.COMPLETED || current == PassengerStatus.CANCELLED) {
            throw new BusinessException("Cannot update status — ride already " + current.name().toLowerCase());
        }

        if (status == PassengerStatus.CANCELLED && current == PassengerStatus.ACTIVE) {
            RideSchedule ride = rp.getRide();
            ride.setAvailableSeats((short) (ride.getAvailableSeats() + 1));
            rideScheduleRepository.save(ride);
        }

        rp.setStatus(status);
        return toResponse(ridePassengerRepository.save(rp));
    }

    @Override
    public List<RidePassengerResponse> getPassengersForRide(Long rideId) {
        return ridePassengerRepository.findByRideId(rideId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<RidePassengerResponse> getRidesForPassenger(Long passengerId) {
        return ridePassengerRepository.findByPassengerId(passengerId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void completeAllPassengers(Long rideId, Long driverId) {
        RideSchedule ride = rideScheduleRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("RideSchedule", rideId));
        if (!ride.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Not authorized for this ride", HttpStatus.FORBIDDEN);
        }
        ridePassengerRepository.findByRideIdAndStatus(rideId, PassengerStatus.ACTIVE)
                .forEach(rp -> {
                    rp.setStatus(PassengerStatus.COMPLETED);
                    ridePassengerRepository.save(rp);
                });
    }

    private RidePassengerResponse toResponse(RidePassenger rp) {
        RideSchedule ride = rp.getRide();
        return RidePassengerResponse.builder()
                .id(rp.getId())
                .rideId(ride.getId())
                .passengerId(rp.getPassenger().getId())
                .passengerName(rp.getPassenger().getName())
                .passengerEmail(rp.getPassenger().getEmail())
                .status(rp.getStatus().name())
                .joinedAt(rp.getJoinedAt())
                .driverId(ride.getDriver() != null ? ride.getDriver().getId() : null)
                .driverName(ride.getDriver() != null ? ride.getDriver().getName() : null)
                .vehicleNumber(ride.getVehicle() != null ? ride.getVehicle().getVehicleNumber() : null)
                .pickupLabel(ride.getPickupLabel())
                .dropoffLabel(ride.getDropoffLabel())
                .departureTime(ride.getDepartureTime())
                .fare(ride.getFare())
                .scheduleStatus(ride.getStatus() != null ? ride.getStatus().name() : null)
                .build();
    }
}
