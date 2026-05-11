package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.response.OrganisationResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.entity.Organisation;
import com.carpooling.entity.User;
import com.carpooling.enums.OrganisationStatus;
import com.carpooling.enums.UserRole;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.repository.OrganisationRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.OrganisationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganisationServiceImpl implements OrganisationService {

    private final OrganisationRepository organisationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OrganisationResponse createOrganisation(OrganisationRequest request) {
        if (organisationRepository.existsByDomain(request.getDomain())) {
            throw new BusinessException("Organisation with this domain already exists");
        }

        Organisation org = organisationRepository.save(Organisation.builder()
                .name(request.getName())
                .domain(request.getDomain().toLowerCase().trim())
                .officeAddress(request.getOfficeAddress())
                .officeLat(request.getOfficeLat())
                .officeLng(request.getOfficeLng())
                .status(OrganisationStatus.PENDING)
                .build());

        return toResponse(org);
    }

    @Override
    public OrganisationResponse getOrganisation(Long orgId) {
        return toResponse(organisationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organisation", orgId)));
    }

    @Override
    public List<OrganisationResponse> getAllOrganisations() {
        return organisationRepository.findAll()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public OrganisationResponse activateOrganisation(Long orgId) {
        Organisation org = organisationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organisation", orgId));
        if (org.getStatus() == OrganisationStatus.ACTIVE) {
            throw new BusinessException("Organisation is already active");
        }
        org.setStatus(OrganisationStatus.ACTIVE);
        return toResponse(organisationRepository.save(org));
    }

    @Override
    @Transactional
    public UserResponse createAdminUser(CreateAdminRequest request) {
        Organisation org = organisationRepository.findById(request.getOrganisationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organisation", request.getOrganisationId()));

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered");
        }

        User admin = userRepository.save(User.builder()
                .name(request.getName().trim())
                .email(email)
                .phone(request.getPhone().trim())
                .gender(request.getGender())
                .role(UserRole.ADMIN)
                .organisation(org)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .driverStatus(VerificationStatus.NONE)
                .passengerStatus(VerificationStatus.NONE)
                .secondaryAddress(org.getOfficeAddress())
                .secondaryLat(org.getOfficeLat())
                .secondaryLng(org.getOfficeLng())
                .build());

        return toUserResponse(admin);
    }

    private OrganisationResponse toResponse(Organisation o) {
        return OrganisationResponse.builder()
                .id(o.getId())
                .name(o.getName())
                .domain(o.getDomain())
                .officeAddress(o.getOfficeAddress())
                .officeLat(o.getOfficeLat())
                .officeLng(o.getOfficeLng())
                .status(o.getStatus())
                .createdAt(o.getCreatedAt())
                .build();
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .gender(u.getGender())
                .role(u.getRole().name())
                .organisationId(u.getOrganisation().getId())
                .organisationName(u.getOrganisation().getName())
                .driverStatus(u.getDriverStatus().name())
                .passengerStatus(u.getPassengerStatus().name())
                .secondaryAddress(u.getSecondaryAddress())
                .secondaryLat(u.getSecondaryLat())
                .secondaryLng(u.getSecondaryLng())
                .build();
    }
}
