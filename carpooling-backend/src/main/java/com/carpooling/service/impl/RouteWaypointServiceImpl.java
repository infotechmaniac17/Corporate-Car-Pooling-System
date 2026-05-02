package com.carpooling.service.impl;

import com.carpooling.common.exception.ResourceNotFoundException;
import com.carpooling.dto.request.AddWaypointRequest;
import com.carpooling.dto.response.RouteWaypointResponse;
import com.carpooling.entity.Route;
import com.carpooling.entity.RouteWaypoint;
import com.carpooling.repository.RouteRepository;
import com.carpooling.repository.RouteWaypointRepository;
import com.carpooling.service.RouteWaypointService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteWaypointServiceImpl implements RouteWaypointService {

    private final RouteWaypointRepository routeWaypointRepository;
    private final RouteRepository routeRepository;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public RouteWaypointResponse addWaypoint(Long routeId, AddWaypointRequest request) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResourceNotFoundException("Route", routeId));

        Point location = GF.createPoint(new Coordinate(request.getLongitude(), request.getLatitude()));
        location.setSRID(4326);

        RouteWaypoint waypoint = routeWaypointRepository.save(RouteWaypoint.builder()
                .route(route)
                .location(location)
                .sequence(request.getSequence())
                .build());

        return toResponse(waypoint);
    }

    @Override
    public List<RouteWaypointResponse> getWaypointsForRoute(Long routeId) {
        return routeWaypointRepository.findByRouteIdOrderBySequenceAsc(routeId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteWaypointsForRoute(Long routeId) {
        routeWaypointRepository.deleteByRouteId(routeId);
    }

    private RouteWaypointResponse toResponse(RouteWaypoint w) {
        return RouteWaypointResponse.builder()
                .id(w.getId())
                .routeId(w.getRoute().getId())
                .latitude(w.getLocation().getY())
                .longitude(w.getLocation().getX())
                .sequence(w.getSequence())
                .build();
    }
}
