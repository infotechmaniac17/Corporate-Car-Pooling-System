package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.dto.request.CreateAdminRequest;
import com.carpooling.dto.request.OrganisationOfficeRequest;
import com.carpooling.dto.request.OrganisationRequest;
import com.carpooling.dto.request.UpdateOrganisationRequest;
import com.carpooling.dto.response.*;
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

    // ── Create ──────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> create(
            @Valid @RequestBody OrganisationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(organisationService.createOrganisation(request)));
    }

    // ── Read ────────────────────────────────────────────────────────────────

    @GetMapping("/{orgId}")
    public ResponseEntity<ApiResponse<OrganisationResponse>> get(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getOrganisation(orgId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrganisationResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getAllOrganisations()));
    }

    // ── Update ──────────────────────────────────────────────────────────────

    @PutMapping("/{orgId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> update(
            @PathVariable Long orgId,
            @Valid @RequestBody UpdateOrganisationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.updateOrganisation(orgId, request)));
    }

    // ── Status ──────────────────────────────────────────────────────────────

    @PostMapping("/{orgId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> activate(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.activateOrganisation(orgId)));
    }

    @PostMapping("/{orgId}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> suspend(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.suspendOrganisation(orgId)));
    }

    @PostMapping("/{orgId}/reactivate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationResponse>> reactivate(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.reactivateOrganisation(orgId)));
    }

    // ── Admins ──────────────────────────────────────────────────────────────

    @PostMapping("/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createAdmin(
            @Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(organisationService.createAdminUser(request)));
    }

    @GetMapping("/{orgId}/admins")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAdmins(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getOrgAdmins(orgId)));
    }

    @DeleteMapping("/{orgId}/admins/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAdmin(
            @PathVariable Long orgId, @PathVariable Long userId) {
        organisationService.removeAdmin(orgId, userId);
        return ResponseEntity.ok(ApiResponse.ok("Admin removed", null));
    }

    // ── Offices ─────────────────────────────────────────────────────────────

    @GetMapping("/{orgId}/offices")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OrganisationOfficeResponse>>> getOffices(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getOrgOffices(orgId)));
    }

    @PostMapping("/{orgId}/offices")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationOfficeResponse>> addOffice(
            @PathVariable Long orgId,
            @Valid @RequestBody OrganisationOfficeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(organisationService.addOffice(orgId, request)));
    }

    @PutMapping("/{orgId}/offices/{officeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganisationOfficeResponse>> updateOffice(
            @PathVariable Long orgId,
            @PathVariable Long officeId,
            @Valid @RequestBody OrganisationOfficeRequest request,
            @RequestParam(defaultValue = "false") boolean syncToUsers) {
        return ResponseEntity.ok(ApiResponse.ok(
                organisationService.updateOffice(orgId, officeId, request, syncToUsers)));
    }

    @DeleteMapping("/{orgId}/offices/{officeId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOffice(
            @PathVariable Long orgId, @PathVariable Long officeId) {
        organisationService.deleteOffice(orgId, officeId);
        return ResponseEntity.ok(ApiResponse.ok("Office deleted", null));
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/{orgId}/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrgStatsResponse>> getStats(@PathVariable Long orgId) {
        return ResponseEntity.ok(ApiResponse.ok(organisationService.getOrgStats(orgId)));
    }
}
