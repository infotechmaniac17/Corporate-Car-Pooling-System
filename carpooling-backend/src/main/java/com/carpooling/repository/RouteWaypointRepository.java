package com.carpooling.repository;

import com.carpooling.entity.RouteWaypoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteWaypointRepository extends JpaRepository<RouteWaypoint, Long> {
    List<RouteWaypoint> findByRouteIdOrderBySequenceAsc(Long routeId);
    void deleteByRouteId(Long routeId);
}
