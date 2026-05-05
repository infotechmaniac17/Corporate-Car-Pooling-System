package com.carpooling.repository;

import com.carpooling.entity.RoleRequest;
import com.carpooling.enums.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRequestRepository extends JpaRepository<RoleRequest, Long> {

    List<RoleRequest> findByStatus(VerificationStatus status);

    List<RoleRequest> findByUserId(Long userId);

    boolean existsByUserIdAndVehiclePlateAndStatus(Long userId, String vehiclePlate, VerificationStatus status);

    Optional<RoleRequest> findTopByUserIdOrderBySubmittedAtDesc(Long userId);
}
