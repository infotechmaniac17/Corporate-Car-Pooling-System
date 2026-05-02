package com.carpooling.service;

import com.carpooling.entity.SosIncident;

import java.util.List;

public interface SosService {
    SosIncident triggerSos(Long rideId, Long userId, double lat, double lng);
    List<SosIncident> getIncidentsByRide(Long rideId);
}
