package com.carpooling.repository;

import com.carpooling.entity.User;
import com.carpooling.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndIsDeletedFalse(String email);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByOrganisationIdAndIsDeletedFalse(Long organisationId);

    @Query("SELECT u FROM User u WHERE u.organisation.id = :orgId AND (u.role = 'DRIVER' OR u.role = 'BOTH') AND u.isDeleted = false")
    List<User> findDriversByOrganisation(@Param("orgId") Long organisationId);
}
