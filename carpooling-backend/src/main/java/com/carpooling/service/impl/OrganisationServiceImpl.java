package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationOfficeRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.request.UpdateOrganisationRequest;
import com.carpooling.dto.response.*;
import com.carpooling.entity.Organisation;
import com.carpooling.entity.OrganisationOffice;
import com.carpooling.entity.User;
import com.carpooling.enums.OrganisationStatus;
import com.carpooling.enums.UserRole;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.repository.OrganisationOfficeRepository;
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
    private final OrganisationOfficeRepository officeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Create ────────────────────────────────────────────────────────────────

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

    // ── Read ──────────────────────────────────────────────────────────────────

    @Override
    public OrganisationResponse getOrganisation(Long orgId) {
        return toResponse(findOrg(orgId));
    }

    @Override
    public List<OrganisationResponse> getAllOrganisations() {
        return organisationRepository.findAll().stream().map(this::toResponse).toList();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrganisationResponse updateOrganisation(Long orgId, UpdateOrganisationRequest request) {
        Organisation org = findOrg(orgId);
        String newDomain = request.getDomain().toLowerCase().trim();
        if (!newDomain.equals(org.getDomain()) && organisationRepository.existsByDomain(newDomain)) {
            throw new BusinessException("Domain already in use by another organisation");
        }
        org.setName(request.getName().trim());
        org.setDomain(newDomain);
        if (request.getOfficeAddress() != null) {
            org.setOfficeAddress(request.getOfficeAddress());
            org.setOfficeLat(request.getOfficeLat());
            org.setOfficeLng(request.getOfficeLng());
        }
        return toResponse(organisationRepository.save(org));
    }

    // ── Status ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrganisationResponse activateOrganisation(Long orgId) {
        Organisation org = findOrg(orgId);
        if (org.getStatus() == OrganisationStatus.ACTIVE) {
            throw new BusinessException("Organisation is already active");
        }
        org.setStatus(OrganisationStatus.ACTIVE);
        return toResponse(organisationRepository.save(org));
    }

    @Override
    @Transactional
    public OrganisationResponse suspendOrganisation(Long orgId) {
        Organisation org = findOrg(orgId);
        if (org.getStatus() == OrganisationStatus.SUSPENDED) {
            throw new BusinessException("Organisation is already suspended");
        }
        org.setStatus(OrganisationStatus.SUSPENDED);
        return toResponse(organisationRepository.save(org));
    }

    @Override
    @Transactional
    public OrganisationResponse reactivateOrganisation(Long orgId) {
        Organisation org = findOrg(orgId);
        if (org.getStatus() != OrganisationStatus.SUSPENDED) {
            throw new BusinessException("Organisation is not suspended");
        }
        org.setStatus(OrganisationStatus.ACTIVE);
        return toResponse(organisationRepository.save(org));
    }

    // ── Admins ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public UserResponse createAdminUser(CreateAdminRequest request) {
        Organisation org = findOrg(request.getOrganisationId());
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

    @Override
    public List<UserResponse> getOrgAdmins(Long orgId) {
        findOrg(orgId);
        return userRepository.findByOrganisationIdAndRoleAndIsDeletedFalse(orgId, UserRole.ADMIN)
                .stream().map(this::toUserResponse).toList();
    }

    @Override
    @Transactional
    public void removeAdmin(Long orgId, Long userId) {
        findOrg(orgId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (!user.getOrganisation().getId().equals(orgId)) {
            throw new BusinessException("User does not belong to this organisation");
        }
        if (user.getRole() != UserRole.ADMIN) {
            throw new BusinessException("User is not an admin");
        }
        user.setIsDeleted(true);
        userRepository.save(user);
    }

    // ── Offices ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrganisationOfficeResponse addOffice(Long orgId, OrganisationOfficeRequest request) {
        Organisation org = findOrg(orgId);
        boolean makePrimary = Boolean.TRUE.equals(request.getIsPrimary());
        if (makePrimary) {
            clearPrimaryFlag(orgId);
        }
        OrganisationOffice office = officeRepository.save(OrganisationOffice.builder()
                .organisation(org)
                .name(request.getName().trim())
                .address(request.getAddress())
                .lat(request.getLat())
                .lng(request.getLng())
                .isPrimary(makePrimary)
                .build());
        return toOfficeResponse(office, 0L);
    }

    @Override
    public List<OrganisationOfficeResponse> getOrgOffices(Long orgId) {
        findOrg(orgId);
        return officeRepository.findByOrganisationId(orgId).stream()
                .map(o -> toOfficeResponse(o, userRepository.findByOfficeIdAndIsDeletedFalse(o.getId()).size()))
                .toList();
    }

    @Override
    @Transactional
    public OrganisationOfficeResponse updateOffice(Long orgId, Long officeId,
                                                   OrganisationOfficeRequest request, boolean syncToUsers) {
        findOrg(orgId);
        OrganisationOffice office = findOffice(orgId, officeId);
        boolean makePrimary = Boolean.TRUE.equals(request.getIsPrimary());
        if (makePrimary && !office.getIsPrimary()) {
            clearPrimaryFlag(orgId);
        }
        office.setName(request.getName().trim());
        office.setAddress(request.getAddress());
        office.setLat(request.getLat());
        office.setLng(request.getLng());
        office.setIsPrimary(makePrimary);
        office = officeRepository.save(office);

        if (syncToUsers && request.getAddress() != null) {
            userRepository.syncOfficeAddressToUsers(officeId, request.getAddress(), request.getLat(), request.getLng());
        }
        long userCount = userRepository.findByOfficeIdAndIsDeletedFalse(officeId).size();
        return toOfficeResponse(office, userCount);
    }

    @Override
    @Transactional
    public void deleteOffice(Long orgId, Long officeId) {
        findOrg(orgId);
        OrganisationOffice office = findOffice(orgId, officeId);
        long linked = userRepository.findByOfficeIdAndIsDeletedFalse(officeId).size();
        if (linked > 0) {
            throw new BusinessException("Cannot delete office with " + linked + " assigned employee(s). Reassign them first.");
        }
        officeRepository.delete(office);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Override
    public OrgStatsResponse getOrgStats(Long orgId) {
        findOrg(orgId);
        long employees = userRepository.countByOrganisationIdAndIsDeletedFalse(orgId);
        long admins = userRepository.findByOrganisationIdAndRoleAndIsDeletedFalse(orgId, UserRole.ADMIN).size();
        long offices = officeRepository.countByOrganisationId(orgId);
        return OrgStatsResponse.builder()
                .orgId(orgId)
                .totalEmployees(employees)
                .totalAdmins(admins)
                .totalOffices(offices)
                .build();
    }

    @Override
    public PlatformStatsResponse getPlatformStats() {
        List<Organisation> all = organisationRepository.findAll();
        long active    = all.stream().filter(o -> o.getStatus() == OrganisationStatus.ACTIVE).count();
        long pending   = all.stream().filter(o -> o.getStatus() == OrganisationStatus.PENDING).count();
        long suspended = all.stream().filter(o -> o.getStatus() == OrganisationStatus.SUSPENDED).count();
        long users  = userRepository.count();
        long admins = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.ADMIN && !u.getIsDeleted()).count();
        return PlatformStatsResponse.builder()
                .totalOrgs(all.size())
                .activeOrgs(active)
                .pendingOrgs(pending)
                .suspendedOrgs(suspended)
                .totalUsers(users)
                .totalAdmins(admins)
                .build();
    }

    @Override
    public List<UserResponse> getAllUsers(Long orgId, String role) {
        List<User> users;
        if (orgId != null && role != null && !role.isBlank()) {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            users = userRepository.findByOrganisationIdAndRoleAndIsDeletedFalse(orgId, userRole);
        } else if (orgId != null) {
            users = userRepository.findByOrganisationIdAndIsDeletedFalse(orgId);
        } else if (role != null && !role.isBlank()) {
            UserRole userRole = UserRole.valueOf(role.toUpperCase());
            users = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == userRole && !u.getIsDeleted()).toList();
        } else {
            users = userRepository.findAll().stream()
                    .filter(u -> !u.getIsDeleted()).toList();
        }
        return users.stream().map(this::toUserResponse).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Organisation findOrg(Long orgId) {
        return organisationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organisation", orgId));
    }

    private OrganisationOffice findOffice(Long orgId, Long officeId) {
        OrganisationOffice office = officeRepository.findById(officeId)
                .orElseThrow(() -> new ResourceNotFoundException("Office", officeId));
        if (!office.getOrganisation().getId().equals(orgId)) {
            throw new BusinessException("Office does not belong to this organisation");
        }
        return office;
    }

    private void clearPrimaryFlag(Long orgId) {
        officeRepository.findByOrganisationIdAndIsPrimaryTrue(orgId)
                .ifPresent(o -> { o.setIsPrimary(false); officeRepository.save(o); });
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

    private OrganisationOfficeResponse toOfficeResponse(OrganisationOffice o, long userCount) {
        return OrganisationOfficeResponse.builder()
                .id(o.getId())
                .organisationId(o.getOrganisation().getId())
                .name(o.getName())
                .address(o.getAddress())
                .lat(o.getLat())
                .lng(o.getLng())
                .isPrimary(o.getIsPrimary())
                .userCount(userCount)
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
                .isSuspended(u.getIsSuspended())
                .officeId(u.getOffice() != null ? u.getOffice().getId() : null)
                .officeName(u.getOffice() != null ? u.getOffice().getName() : null)
                .build();
    }
}
