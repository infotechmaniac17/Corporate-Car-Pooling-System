package com.carpooling.service;

import com.carpooling.dto.request.RideRequestDto;
import com.carpooling.dto.response.RideRequestResponse;
import com.carpooling.enums.RequestStatus;

import java.util.List;

public interface RideRequestService {
    RideRequestResponse createRequest(Long passengerId, RideRequestDto dto);
    RideRequestResponse updateRequestStatus(Long requestId, Long driverId, RequestStatus newStatus);
    List<RideRequestResponse> getRequestsForRide(Long rideId);
    List<RideRequestResponse> getPassengerRequests(Long passengerId);
    List<RideRequestResponse> getRequestsForDriver(Long driverId);
    RideRequestResponse cancelByPassenger(Long requestId, Long passengerId);
}
