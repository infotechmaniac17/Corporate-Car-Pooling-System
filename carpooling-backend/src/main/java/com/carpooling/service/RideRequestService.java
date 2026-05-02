package com.carpooling.service;

import com.carpooling.dto.request.RideRequestDto;
import com.carpooling.entity.RideRequest;
import com.carpooling.enums.RequestStatus;

import java.util.List;

public interface RideRequestService {
    RideRequest createRequest(Long passengerId, RideRequestDto dto);
    RideRequest updateRequestStatus(Long requestId, Long driverId, RequestStatus newStatus);
    List<RideRequest> getRequestsForRide(Long rideId);
    List<RideRequest> getPassengerRequests(Long passengerId);
}
