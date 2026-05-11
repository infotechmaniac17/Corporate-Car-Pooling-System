package com.carpooling.service;

import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.response.OrganisationResponse;
import com.carpooling.dto.response.UserResponse;

import java.util.List;

public interface OrganisationService {
    OrganisationResponse createOrganisation(OrganisationRequest request);
    OrganisationResponse getOrganisation(Long orgId);
    List<OrganisationResponse> getAllOrganisations();
    OrganisationResponse activateOrganisation(Long orgId);
    UserResponse createAdminUser(CreateAdminRequest request);
}
