package com.carpooling.entity;

import com.carpooling.enums.PassengerStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "ride_passengers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"ride_id", "passenger_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RidePassenger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ride_id", nullable = false)
    private RideSchedule ride;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "passenger_id", nullable = false)
    private User passenger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "passenger_status")
    @Builder.Default
    private PassengerStatus status = PassengerStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private OffsetDateTime joinedAt;
}
