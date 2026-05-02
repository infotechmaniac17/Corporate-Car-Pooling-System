package com.carpooling.service.impl;

import com.carpooling.dto.request.MatchRideRequest;
import com.carpooling.dto.response.MatchedRideResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchingServiceImpl implements MatchingService {

    private final RideScheduleRepository rideScheduleRepository;
    private final JdbcTemplate jdbcTemplate;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double EARTH_RADIUS_M = 6_371_000.0;

    @Override
    public List<MatchedRideResponse> findMatchingRides(Long passengerId, MatchRideRequest request) {
        OffsetDateTime from = request.getDesiredDepartureTime().minusHours(1);
        OffsetDateTime to = request.getDesiredDepartureTime().plusHours(1);

        List<RideSchedule> candidates = rideScheduleRepository.findAvailableSchedules(from, to);

        List<MatchedRideResponse> results = new ArrayList<>();

        for (RideSchedule schedule : candidates) {
            // Skip same user
            if (schedule.getDriver().getId().equals(passengerId)) continue;

            // Gender filter
            if (request.getGenderPreference() != null && !request.getGenderPreference().isBlank()) {
                String driverGender = schedule.getDriver().getGender();
                if (!request.getGenderPreference().equalsIgnoreCase(driverGender)) continue;
            }

            // Proximity: pickup within search radius
            double distToPickup = haversineMeters(
                    request.getPickupLat(), request.getPickupLng(),
                    schedule.getRoute().getPath().getStartPoint().getY(),
                    schedule.getRoute().getPath().getStartPoint().getX());

            if (distToPickup > request.getSearchRadiusMeters()) continue;

            // Detour check: passenger route must not exceed driver's detour limit
            double detourPct = calculateDetourPercent(
                    schedule.getRoute().getPath(),
                    request.getPickupLat(), request.getPickupLng(),
                    request.getDropLat(), request.getDropLng());

            if (detourPct > schedule.getDetourLimitPercent().doubleValue()) continue;

            BigDecimal fare = estimateFare(
                    request.getPickupLat(), request.getPickupLng(),
                    request.getDropLat(), request.getDropLng());

            results.add(MatchedRideResponse.builder()
                    .rideScheduleId(schedule.getId())
                    .driverId(schedule.getDriver().getId())
                    .driverName(schedule.getDriver().getName())
                    .driverRating(schedule.getDriver().getRating())
                    .vehicleNumber(schedule.getVehicle().getVehicleNumber())
                    .availableSeats(schedule.getAvailableSeats())
                    .departureTime(schedule.getDepartureTime())
                    .distanceToPickupMeters(distToPickup)
                    .detourPercent(detourPct)
                    .estimatedFare(fare)
                    .build());
        }

        // Sort: distance ASC, then rating DESC
        results.sort(Comparator.comparingDouble(MatchedRideResponse::getDistanceToPickupMeters)
                .thenComparing(r -> r.getDriverRating() == null ? BigDecimal.ZERO : r.getDriverRating(),
                        Comparator.reverseOrder()));

        return results;
    }

    private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double calculateDetourPercent(LineString driverPath,
                                          double pickupLat, double pickupLng,
                                          double dropLat, double dropLng) {
        double originalLength = driverPath.getLength();
        if (originalLength == 0) return 0;

        // Detour = extra distance added by going to pickup + drop
        Coordinate start = driverPath.getStartPoint().getCoordinate();
        Coordinate end = driverPath.getEndPoint().getCoordinate();

        double directToPickup = haversineMeters(start.y, start.x, pickupLat, pickupLng);
        double pickupToDrop = haversineMeters(pickupLat, pickupLng, dropLat, dropLng);
        double dropToEnd = haversineMeters(dropLat, dropLng, end.y, end.x);

        double detourLength = directToPickup + pickupToDrop + dropToEnd;
        double originalLengthMeters = haversineMeters(start.y, start.x, end.y, end.x);

        if (originalLengthMeters == 0) return 0;
        return ((detourLength - originalLengthMeters) / originalLengthMeters) * 100;
    }

    private BigDecimal estimateFare(double pickupLat, double pickupLng,
                                    double dropLat, double dropLng) {
        double distKm = haversineMeters(pickupLat, pickupLng, dropLat, dropLng) / 1000.0;
        double fare = 10.0 + (distKm * 8.0); // base ₹10 + ₹8/km
        return BigDecimal.valueOf(Math.round(fare * 100.0) / 100.0);
    }
}
