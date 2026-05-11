package com.carpooling.repository;

import com.carpooling.entity.OrganisationOffice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrganisationOfficeRepository extends JpaRepository<OrganisationOffice, Long> {
    List<OrganisationOffice> findByOrganisationId(Long organisationId);
    Optional<OrganisationOffice> findByOrganisationIdAndIsPrimaryTrue(Long organisationId);
    long countByOrganisationId(Long organisationId);
}
