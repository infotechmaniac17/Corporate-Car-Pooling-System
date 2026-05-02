package com.carpooling.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "route_waypoints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RouteWaypoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @Column(columnDefinition = "geography(Point,4326)", nullable = false)
    private Point location;

    @Column(nullable = false)
    private Integer sequence;
}
