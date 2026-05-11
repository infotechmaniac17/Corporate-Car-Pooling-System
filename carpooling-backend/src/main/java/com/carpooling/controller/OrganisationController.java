package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.response.OrganisationResponse;
import com.carpooling.dto.response.UserResponse;
import com.carpooling.service.OrganisationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/organisations")
@RequiredArgsConstructor
public class OrganisationController {

    private final OrganisationService organisationService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> create(
            @Valid @RequestBody OrganisationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(organisationService.createOrganisation(request)));
    }

    @PostMapping("/{orgId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> activate(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.activateOrganisation(orgId)));
    }

    @PostMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createAdmin(
            @Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(organisationService.createAdminUser(request)));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganisationResponse>> get(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getOrganisation(orgId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganisationResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getAllOrganisations()));
    }
}
