package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.VehicleRequest;
import com.carpooling.dto.response.VehicleResponse;
import com.carpooling.entity.User;
import com.carpooling.entity.Vehicle;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.VehicleRepository;
import com.carpooling.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public VehicleResponse registerVehicle(Long driverId, VehicleRequest request) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", driverId));

        if (vehicleRepository.existsByVehicleNumber(request.getVehicleNumber())) {
            throw new BusinessException("Vehicle number already registered");
        }

        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .driver(driver)
                .vehicleNumber(request.getVehicleNumber())
                .capacity(request.getCapacity())
                .build());

        return toResponse(vehicle);
    }

    @Override
    public List<VehicleResponse> getMyVehicles(Long driverId) {
        return vehicleRepository.findByDriverId(driverId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public VehicleResponse getVehicle(Long vehicleId) {
        return toResponse(vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId)));
    }

    @Override
    @Transactional
    public void deleteVehicle(Long vehicleId, Long driverId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        if (!vehicle.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Not authorized to delete this vehicle", HttpStatus.FORBIDDEN);
        }
        vehicleRepository.delete(vehicle);
    }

    private VehicleResponse toResponse(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .driverId(v.getDriver().getId())
                .driverName(v.getDriver().getName())
                .vehicleNumber(v.getVehicleNumber())
                .capacity(v.getCapacity())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
