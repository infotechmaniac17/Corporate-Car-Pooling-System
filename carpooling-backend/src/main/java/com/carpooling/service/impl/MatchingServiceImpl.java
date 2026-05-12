package com.carpooling.service.impl;

import com.carpooling.dto.request.MatchRideRequest;
import com.carpooling.dto.response.MatchedRideResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.User;
import com.carpooling.enums.GenderPreference;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Point;
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
    private final UserRepository userRepository;

    private static final double EARTH_RADIUS_M = 6_371_000.0;

    @Override
    public List<MatchedRideResponse> findMatchingRides(Long passengerId, MatchRideRequest request) {
        OffsetDateTime from = request.getDesiredDepartureTime().minusHours(1);
        OffsetDateTime to = request.getDesiredDepartureTime().plusHours(1);

        List<RideSchedule> candidates = rideScheduleRepository.findAvailableSchedules(from, to);

        User passenger = userRepository.findById(passengerId).orElse(null);
        String passengerGender = passenger != null ? passenger.getGender() : null;

        List<MatchedRideResponse> results = new ArrayList<>();

        for (RideSchedule schedule : candidates) {
            // Skip same user
            if (schedule.getDriver().getId().equals(passengerId)) continue;

            // Gender preference: ride restricts to specific gender — skip if passenger doesn't match
            GenderPreference rideGenderPref = schedule.getGenderPreference();
            if (rideGenderPref != null && rideGenderPref != GenderPreference.ANY) {
                if (passengerGender == null || !rideGenderPref.name().equalsIgnoreCase(passengerGender)) continue;
            }

            // Resolve driver pickup/dropoff: prefer direct columns; fall back to legacy Route.
            double driverPickupLat, driverPickupLng, driverDropLat, driverDropLng;
            if (schedule.getPickupLocation() != null && schedule.getDropoffLocation() != null) {
                driverPickupLat = schedule.getPickupLocation().getY();
                driverPickupLng = schedule.getPickupLocation().getX();
                driverDropLat = schedule.getDropoffLocation().getY();
                driverDropLng = schedule.getDropoffLocation().getX();
            } else if (schedule.getRoute() != null && schedule.getRoute().getPath() != null) {
                Point start = schedule.getRoute().getPath().getStartPoint();
                Point end = schedule.getRoute().getPath().getEndPoint();
                driverPickupLat = start.getY();
                driverPickupLng = start.getX();
                driverDropLat = end.getY();
                driverDropLng = end.getX();
            } else {
                continue;
            }

            // Corridor proximity: passenger pickup within search radius of driver's route line
            double distToPickup = distanceToSegmentMeters(
                    request.getPickupLat(), request.getPickupLng(),
                    driverPickupLat, driverPickupLng,
                    driverDropLat, driverDropLng);

            if (distToPickup > request.getSearchRadiusMeters()) continue;

            // Detour check: passenger route must not exceed driver's detour limit
            double detourPct = calculateDetourPercentByPoints(
                    driverPickupLat, driverPickupLng,
                    driverDropLat, driverDropLng,
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

    /**
     * Minimum distance from point P to the great-circle segment A→B.
     * Uses equirectangular projection (accurate enough for typical city-scale detours).
     */
    private double distanceToSegmentMeters(double pLat, double pLng,
                                           double aLat, double aLng,
                                           double bLat, double bLng) {
        double ax = Math.toRadians(aLng) * Math.cos(Math.toRadians((aLat + bLat) / 2));
        double ay = Math.toRadians(aLat);
        double bx = Math.toRadians(bLng) * Math.cos(Math.toRadians((aLat + bLat) / 2));
        double by = Math.toRadians(bLat);
        double px = Math.toRadians(pLng) * Math.cos(Math.toRadians((aLat + bLat) / 2));
        double py = Math.toRadians(pLat);

        double dx = bx - ax;
        double dy = by - ay;
        double lenSq = dx * dx + dy * dy;

        double t = lenSq == 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));

        double closestX = ax + t * dx;
        double closestY = ay + t * dy;

        double closestLat = Math.toDegrees(closestY);
        double closestLng = Math.toDegrees(closestX / Math.cos(Math.toRadians((aLat + bLat) / 2)));

        return haversineMeters(pLat, pLng, closestLat, closestLng);
    }

    private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double calculateDetourPercentByPoints(double driverStartLat, double driverStartLng,
                                                  double driverEndLat, double driverEndLng,
                                                  double pickupLat, double pickupLng,
                                                  double dropLat, double dropLng) {
        double directToPickup = haversineMeters(driverStartLat, driverStartLng, pickupLat, pickupLng);
        double pickupToDrop = haversineMeters(pickupLat, pickupLng, dropLat, dropLng);
        double dropToEnd = haversineMeters(dropLat, dropLng, driverEndLat, driverEndLng);

        double detourLength = directToPickup + pickupToDrop + dropToEnd;
        double originalLengthMeters = haversineMeters(driverStartLat, driverStartLng, driverEndLat, driverEndLng);

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
