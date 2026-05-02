package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.response.OrganisationResponse;
import com.carpooling.entity.Organisation;
import com.carpooling.repository.OrganisationRepository;
import com.carpooling.service.OrganisationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganisationServiceImpl implements OrganisationService {

    private final OrganisationRepository organisationRepository;

    @Override
    @Transactional
    public OrganisationResponse createOrganisation(OrganisationRequest request) {
        if (organisationRepository.existsByDomain(request.getDomain())) {
            throw new BusinessException("Organisation with this domain already exists");
        }

        Organisation org = organisationRepository.save(Organisation.builder()
                .name(request.getName())
                .domain(request.getDomain())
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

    private OrganisationResponse toResponse(Organisation o) {
        return OrganisationResponse.builder()
                .id(o.getId())
                .name(o.getName())
                .domain(o.getDomain())
                .createdAt(o.getCreatedAt())
                .build();
    }
}
