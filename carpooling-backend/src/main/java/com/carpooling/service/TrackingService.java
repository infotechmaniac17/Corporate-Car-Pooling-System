package com.carpooling.service;

import com.carpooling.dto.request.LocationPingRequest;
import com.carpooling.entity.RideLocationPing;

import java.util.Optional;

public interface TrackingService {
    void recordPing(LocationPingRequest request);
    Optional<RideLocationPing> getLatestPing(Long rideId);
}
