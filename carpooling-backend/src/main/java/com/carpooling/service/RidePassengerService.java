package com.carpooling.service;

import com.carpooling.dto.response.RidePassengerResponse;
import com.carpooling.enums.PassengerStatus;

import java.util.List;

public interface RidePassengerService {
    RidePassengerResponse addPassenger(Long rideId, Long passengerId);
    RidePassengerResponse updateStatus(Long rideId, Long passengerId, PassengerStatus status);
    List<RidePassengerResponse> getPassengersForRide(Long rideId);
    List<RidePassengerResponse> getRidesForPassenger(Long passengerId);
    void completeAllPassengers(Long rideId, Long driverId);
}
