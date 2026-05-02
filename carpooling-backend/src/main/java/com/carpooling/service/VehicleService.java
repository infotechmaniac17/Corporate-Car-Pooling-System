package com.carpooling.service;

import com.carpooling.dto.request.VehicleRequest;
import com.carpooling.dto.response.VehicleResponse;

import java.util.List;

public interface VehicleService {
    VehicleResponse registerVehicle(Long driverId, VehicleRequest request);
    List<VehicleResponse> getMyVehicles(Long driverId);
    VehicleResponse getVehicle(Long vehicleId);
    void deleteVehicle(Long vehicleId, Long driverId);
}
