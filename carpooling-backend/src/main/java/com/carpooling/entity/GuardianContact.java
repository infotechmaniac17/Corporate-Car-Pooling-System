package com.carpooling.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "guardian_contacts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GuardianContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String relation;

    @Column
    private String email;
}
