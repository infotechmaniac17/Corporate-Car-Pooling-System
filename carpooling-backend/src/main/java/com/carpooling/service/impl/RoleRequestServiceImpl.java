package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.DriverRoleRequestDto;
import com.carpooling.dto.response.RoleRequestResponse;
import com.carpooling.entity.RoleRequest;
import com.carpooling.entity.User;
import com.carpooling.enums.UserRole;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.repository.RoleRequestRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.EmailService;
import com.carpooling.service.FileStorageService;
import com.carpooling.service.RoleRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleRequestServiceImpl implements RoleRequestService {

    private final RoleRequestRepository roleRequestRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final EmailService emailService;

    @Override
    @Transactional
    public RoleRequestResponse submitDriverRequest(Long userId, DriverRoleRequestDto dto,
                                                   MultipartFile licenseDoc,
                                                   MultipartFile idProofDoc,
                                                   MultipartFile rcDoc,
                                                   MultipartFile insuranceDoc) {
        if (roleRequestRepository.existsByUserIdAndVehiclePlateAndStatus(
                userId, dto.getVehiclePlate(), VerificationStatus.PENDING)) {
            throw new BusinessException("A pending request already exists for vehicle " + dto.getVehiclePlate());
        }

        String licenseUrl   = fileStorageService.store(licenseDoc,   "license");
        String idProofUrl   = fileStorageService.store(idProofDoc,   "idproof");
        String rcUrl        = fileStorageService.store(rcDoc,        "rc");
        String insuranceUrl = fileStorageService.store(insuranceDoc, "insurance");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        RoleRequest request = RoleRequest.builder()
                .user(user)
                .vehiclePlate(dto.getVehiclePlate())
                .vehicleModel(dto.getVehicleModel())
                .vehicleType(dto.getVehicleType())
                .vehicleFuel(dto.getVehicleFuel())
                .vehicleSeats(dto.getVehicleSeats())
                .licenseNumber(dto.getLicenseNumber())
                .licenseExpiry(dto.getLicenseExpiry())
                .licenseDocUrl(licenseUrl)
                .idProofType(dto.getIdProofType())
                .idProofNumber(dto.getIdProofNumber())
                .idProofDocUrl(idProofUrl)
                .rcNumber(dto.getRcNumber())
                .rcDocUrl(rcUrl)
                .insuranceNumber(dto.getInsuranceNumber())
                .insuranceExpiry(dto.getInsuranceExpiry())
                .insuranceDocUrl(insuranceUrl)
                .status(VerificationStatus.PENDING)
                .build();

        request = roleRequestRepository.save(request);
        return toResponse(request);
    }

    @Override
    @Transactional
    public void submitPassengerRequest(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getDriverStatus() != VerificationStatus.APPROVED) {
            throw new BusinessException("Only approved drivers can enable rider mode");
        }
        user.setPassengerStatus(VerificationStatus.APPROVED);
        user.setRole(UserRole.BOTH);
        userRepository.save(user);
    }

    @Override
    public List<RoleRequestResponse> listByStatus(VerificationStatus status) {
        return roleRequestRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<RoleRequestResponse> getMyRequests(Long userId) {
        return roleRequestRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoleRequestResponse approve(Long requestId, Long adminId) {
        RoleRequest request = roleRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RoleRequest", requestId));
        if (request.getStatus() != VerificationStatus.PENDING) {
            throw new BusinessException("Request is not in PENDING state");
        }
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        request.setStatus(VerificationStatus.APPROVED);
        request.setAdmin(admin);
        request.setDecidedAt(OffsetDateTime.now());
        roleRequestRepository.save(request);

        User user = request.getUser();
        user.setDriverStatus(VerificationStatus.APPROVED);
        if (user.getPassengerStatus() == VerificationStatus.APPROVED) {
            user.setRole(UserRole.BOTH);
        } else {
            user.setRole(UserRole.DRIVER);
        }
        userRepository.save(user);

        emailService.sendDriverApproval(user, admin, request);
        return toResponse(request);
    }

    @Override
    @Transactional
    public RoleRequestResponse reject(Long requestId, Long adminId, String reason) {
        RoleRequest request = roleRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("RoleRequest", requestId));
        if (request.getStatus() != VerificationStatus.PENDING) {
            throw new BusinessException("Request is not in PENDING state");
        }
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        request.setStatus(VerificationStatus.REJECTED);
        request.setAdmin(admin);
        request.setAdminNote(reason);
        request.setDecidedAt(OffsetDateTime.now());
        roleRequestRepository.save(request);

        User user = request.getUser();
        user.setDriverStatus(VerificationStatus.REJECTED);
        userRepository.save(user);

        emailService.sendDriverRejection(user, admin, request, reason);
        return toResponse(request);
    }

    private RoleRequestResponse toResponse(RoleRequest r) {
        return RoleRequestResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .userEmail(r.getUser().getEmail())
                .vehiclePlate(r.getVehiclePlate())
                .vehicleModel(r.getVehicleModel())
                .vehicleType(r.getVehicleType())
                .vehicleFuel(r.getVehicleFuel())
                .vehicleSeats(r.getVehicleSeats())
                .licenseNumber(r.getLicenseNumber())
                .licenseExpiry(r.getLicenseExpiry())
                .licenseDocUrl(r.getLicenseDocUrl())
                .idProofType(r.getIdProofType())
                .idProofNumber(r.getIdProofNumber())
                .idProofDocUrl(r.getIdProofDocUrl())
                .rcNumber(r.getRcNumber())
                .rcDocUrl(r.getRcDocUrl())
                .insuranceNumber(r.getInsuranceNumber())
                .insuranceExpiry(r.getInsuranceExpiry())
                .insuranceDocUrl(r.getInsuranceDocUrl())
                .status(r.getStatus().name())
                .adminNote(r.getAdminNote())
                .submittedAt(r.getSubmittedAt())
                .decidedAt(r.getDecidedAt())
                .build();
    }
}
