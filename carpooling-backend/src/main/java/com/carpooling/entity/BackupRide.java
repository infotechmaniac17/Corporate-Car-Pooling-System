package com.carpooling.entity;

import com.carpooling.enums.BackupStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "backup_rides",
       uniqueConstraints = @UniqueConstraint(columnNames = {"ride_id", "backup_driver_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BackupRide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ride_id", nullable = false)
    private RideSchedule rideSchedule;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "backup_driver_id", nullable = false)
    private User backupDriver;

    @Column(nullable = false)
    @Builder.Default
    private Short priority = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BackupStatus status = BackupStatus.PENDING;

    @Column(name = "activated_at")
    private OffsetDateTime activatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
