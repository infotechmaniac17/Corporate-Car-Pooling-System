package com.carpooling.repository;

import com.carpooling.entity.GuardianContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuardianContactRepository extends JpaRepository<GuardianContact, Long> {
    List<GuardianContact> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
