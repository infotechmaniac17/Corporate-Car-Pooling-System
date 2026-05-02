package com.carpooling.repository;

import com.carpooling.entity.Organisation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
    Optional<Organisation> findByDomain(String domain);
    boolean existsByDomain(String domain);
}
