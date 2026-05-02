package com.carpooling.service;

import com.carpooling.dto.request.MatchRideRequest;
import com.carpooling.dto.response.MatchedRideResponse;

import java.util.List;

public interface MatchingService {
    List<MatchedRideResponse> findMatchingRides(Long passengerId, MatchRideRequest request);
}
