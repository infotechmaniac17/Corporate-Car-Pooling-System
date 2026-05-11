package com.carpooling.service;

import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationOfficeRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.request.UpdateOrganisationRequest;
import com.carpooling.dto.response.*;

import java.util.List;

public interface OrganisationService {
    OrganisationResponse createOrganisation(OrganisationRequest request);
    OrganisationResponse getOrganisation(Long orgId);
    List<OrganisationResponse> getAllOrganisations();
    OrganisationResponse activateOrganisation(Long orgId);
    OrganisationResponse updateOrganisation(Long orgId, UpdateOrganisationRequest request);
    OrganisationResponse suspendOrganisation(Long orgId);
    OrganisationResponse reactivateOrganisation(Long orgId);
    UserResponse createAdminUser(CreateAdminRequest request);
    List<UserResponse> getOrgAdmins(Long orgId);
    void removeAdmin(Long orgId, Long userId);

    OrganisationOfficeResponse addOffice(Long orgId, OrganisationOfficeRequest request);
    List<OrganisationOfficeResponse> getOrgOffices(Long orgId);
    OrganisationOfficeResponse updateOffice(Long orgId, Long officeId, OrganisationOfficeRequest request, boolean syncToUsers);
    void deleteOffice(Long orgId, Long officeId);

    OrgStatsResponse getOrgStats(Long orgId);
    PlatformStatsResponse getPlatformStats();
    List<UserResponse> getAllUsers(Long orgId, String role);
}
