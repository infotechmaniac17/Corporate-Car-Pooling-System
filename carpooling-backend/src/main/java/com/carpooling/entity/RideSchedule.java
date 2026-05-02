package com.carpooling.entity;

import com.carpooling.enums.GenderPreference;
import com.carpooling.enums.ScheduleStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "ride_schedules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RideSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Column(name = "departure_time", nullable = false)
    private OffsetDateTime departureTime;

    @Column(name = "available_seats", nullable = false)
    private Short availableSeats;

    @Column(name = "detour_limit_percent", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal detourLimitPercent = BigDecimal.valueOf(20.00);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "schedule_status")
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.CREATED;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_preference", columnDefinition = "VARCHAR(20)")
    private GenderPreference genderPreference;

    @Column(name = "cancel_reason")
    private String cancelReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
