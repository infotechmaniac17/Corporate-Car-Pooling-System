package com.carpooling.entity;

import com.carpooling.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "role_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoleRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "vehicle_plate", nullable = false)
    private String vehiclePlate;

    @Column(name = "vehicle_model", nullable = false)
    private String vehicleModel;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "vehicle_fuel", nullable = false)
    private String vehicleFuel;

    @Column(name = "vehicle_seats", nullable = false)
    private Short vehicleSeats;

    @Column(name = "license_number", nullable = false)
    private String licenseNumber;

    @Column(name = "license_expiry", nullable = false)
    private LocalDate licenseExpiry;

    @Column(name = "license_doc_url", nullable = false)
    private String licenseDocUrl;

    @Column(name = "id_proof_type", nullable = false)
    private String idProofType;

    @Column(name = "id_proof_number", nullable = false)
    private String idProofNumber;

    @Column(name = "id_proof_doc_url", nullable = false)
    private String idProofDocUrl;

    @Column(name = "rc_number", nullable = false)
    private String rcNumber;

    @Column(name = "rc_doc_url", nullable = false)
    private String rcDocUrl;

    @Column(name = "insurance_number", nullable = false)
    private String insuranceNumber;

    @Column(name = "insurance_expiry", nullable = false)
    private LocalDate insuranceExpiry;

    @Column(name = "insurance_doc_url", nullable = false)
    private String insuranceDocUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "verification_status")
    @Builder.Default
    private VerificationStatus status = VerificationStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    @Column(name = "admin_note")
    private String adminNote;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private OffsetDateTime submittedAt;

    @Column(name = "decided_at")
    private OffsetDateTime decidedAt;
}
