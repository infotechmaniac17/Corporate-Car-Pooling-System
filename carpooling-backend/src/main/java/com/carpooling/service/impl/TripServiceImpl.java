package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.dto.request.BookTripRequest;
import com.carpooling.dto.request.PublishTripRequest;
import com.carpooling.dto.response.TripBookingResponse;
import com.carpooling.dto.response.TripResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.Route;
import com.carpooling.entity.TripBooking;
import com.carpooling.entity.User;
import com.carpooling.entity.Vehicle;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.RouteRepository;
import com.carpooling.repository.TripBookingRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.VehicleRepository;
import com.carpooling.service.TripService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final RideScheduleRepository scheduleRepository;
    private final TripBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);

    @Override
    @Transactional
    public TripResponse publishTrip(Long driverId, PublishTripRequest request) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new BusinessException("Driver not found"));
        if (driver.getDriverStatus() != VerificationStatus.APPROVED) {
            throw new BusinessException("Driver verification is pending or not approved");
        }
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new BusinessException("Vehicle not found"));

        RideSchedule schedule = RideSchedule.builder()
                .driver(driver)
                .vehicle(vehicle)
                .pickupLocation(makePoint(request.getPickupLng(), request.getPickupLat()))
                .pickupLabel(request.getPickupLabel())
                .dropoffLocation(makePoint(request.getDropoffLng(), request.getDropoffLat()))
                .dropoffLabel(request.getDropoffLabel())
                .fare(request.getFare())
                .departureTime(request.getDepartureTime())
                .availableSeats(request.getAvailableSeats())
                .detourLimitPercent(request.getDetourLimitPercent() != null
                        ? request.getDetourLimitPercent() : BigDecimal.valueOf(20))
                .status(ScheduleStatus.CREATED)
                .genderPreference(request.getGenderPreference())
                .recurringDays(request.getRecurringDays())
                .bookedSeats(0)
                .build();

        if (request.getRouteGeometry() != null && request.getRouteGeometry().size() >= 2) {
            Coordinate[] coords = request.getRouteGeometry().stream()
                    .map(pair -> new Coordinate(pair.get(0), pair.get(1))) // lng, lat
                    .toArray(Coordinate[]::new);
            LineString lineString = GF.createLineString(coords);
            double distKm = computeDistanceKm(request.getRouteGeometry());
            Route route = Route.builder()
                    .user(driver)
                    .path(lineString)
                    .distanceKm(BigDecimal.valueOf(distKm))
                    .build();
            route = routeRepository.save(route);
            schedule.setRoute(route);
        }

        schedule = scheduleRepository.save(schedule);
        return toTripResponse(schedule);
    }

    @Override
    public List<TripResponse> getTripFeed(Long userId, LocalDate date, Integer minSeats,
                                          Double pickupLat, Double pickupLng,
                                          Double dropoffLat, Double dropoffLng,
                                          Double radiusMeters) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        if (user.getOrganisation() == null) {
            throw new BusinessException("User has no organisation");
        }
        Long orgId = user.getOrganisation().getId();

        // Always pass non-null date bounds; use far future when no date filter requested.
        // This avoids IS NULL on typed params which breaks with Hibernate 6 + named enum.
        OffsetDateTime dateStart = date != null
                ? date.atStartOfDay().atOffset(ZoneOffset.UTC)
                : OffsetDateTime.now().minusDays(1);
        OffsetDateTime dateEnd = date != null
                ? date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC)
                : OffsetDateTime.now().plusYears(10);

        double radius = radiusMeters != null ? radiusMeters : 5000.0;
        boolean filterByPickup  = pickupLat  != null && pickupLng  != null;
        boolean filterByDropoff = dropoffLat != null && dropoffLng != null;

        return scheduleRepository.findOrgTripFeed(orgId, ScheduleStatus.CREATED, OffsetDateTime.now(), dateStart, dateEnd)
                .stream()
                .filter(s -> !s.getDriver().getId().equals(userId))
                .filter(s -> {
                    int left = s.getAvailableSeats() - safeBooked(s);
                    return minSeats == null ? left > 0 : left >= minSeats;
                })
                .filter(s -> {
                    if (!filterByPickup) return true;
                    if (s.getPickupLocation() == null) return false;
                    double distM = haversineKm(pickupLat, pickupLng,
                            s.getPickupLocation().getY(), s.getPickupLocation().getX()) * 1000.0;
                    return distM <= radius;
                })
                .filter(s -> {
                    if (!filterByDropoff) return true;
                    if (s.getDropoffLocation() == null) return false;
                    double distM = haversineKm(dropoffLat, dropoffLng,
                            s.getDropoffLocation().getY(), s.getDropoffLocation().getX()) * 1000.0;
                    return distM <= radius;
                })
                .map(this::toTripResponse)
                .toList();
    }

    @Override
    public TripResponse getTripById(Long tripId) {
        return toTripResponse(scheduleRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new BusinessException("Trip not found")));
    }

    @Override
    public List<TripResponse> getDriverTrips(Long driverId) {
        return scheduleRepository.findByDriverIdOrderByDepartureTimeDesc(driverId)
                .stream().map(this::toTripResponse).toList();
    }

    @Override
    @Transactional
    public TripBookingResponse bookSeat(Long tripId, Long passengerId, BookTripRequest request) {
        RideSchedule schedule = scheduleRepository.findByIdWithDetails(tripId)
                .orElseThrow(() -> new BusinessException("Trip not found"));

        if (schedule.getStatus() == ScheduleStatus.CANCELLED
                || schedule.getStatus() == ScheduleStatus.COMPLETED) {
            throw new BusinessException("Trip is no longer available for booking");
        }
        if (schedule.getDriver().getId().equals(passengerId)) {
            throw new BusinessException("Driver cannot book their own trip");
        }

        int seatsLeft = schedule.getAvailableSeats() - safeBooked(schedule);
        if (seatsLeft <= 0) {
            throw new BusinessException("No seats available on this trip");
        }

        if (bookingRepository.existsByRideScheduleIdAndPassengerIdAndStatusNot(tripId, passengerId, "CANCELLED")) {
            throw new BusinessException("You have already booked this trip");
        }

        User passenger = userRepository.findById(passengerId)
                .orElseThrow(() -> new BusinessException("Passenger not found"));

        if (passenger.getOrganisation() == null || schedule.getDriver().getOrganisation() == null
                || !passenger.getOrganisation().getId().equals(schedule.getDriver().getOrganisation().getId())) {
            throw new BusinessException("You can only book trips within your organisation");
        }

        // Use passenger's supplied coords; fall back to trip endpoint
        TripBooking booking = TripBooking.builder()
                .rideSchedule(schedule)
                .passenger(passenger)
                .pickupLat(orDefault(request.getPickupLat(),
                        schedule.getPickupLocation() != null ? schedule.getPickupLocation().getY() : null))
                .pickupLng(orDefault(request.getPickupLng(),
                        schedule.getPickupLocation() != null ? schedule.getPickupLocation().getX() : null))
                .pickupLabel(orDefault(request.getPickupLabel(), schedule.getPickupLabel()))
                .dropoffLat(orDefault(request.getDropoffLat(),
                        schedule.getDropoffLocation() != null ? schedule.getDropoffLocation().getY() : null))
                .dropoffLng(orDefault(request.getDropoffLng(),
                        schedule.getDropoffLocation() != null ? schedule.getDropoffLocation().getX() : null))
                .dropoffLabel(orDefault(request.getDropoffLabel(), schedule.getDropoffLabel()))
                .status("CONFIRMED")
                .build();

        bookingRepository.save(booking);
        schedule.setBookedSeats(safeBooked(schedule) + 1);
        scheduleRepository.save(schedule);

        return toBookingResponse(booking, schedule);
    }

    @Override
    @Transactional
    public void cancelBooking(Long tripId, Long bookingId, Long userId) {
        TripBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("Booking not found"));
        if (!booking.getRideSchedule().getId().equals(tripId)) {
            throw new BusinessException("Booking does not belong to this trip");
        }
        if (!booking.getPassenger().getId().equals(userId)) {
            throw new BusinessException("You can only cancel your own bookings");
        }
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new BusinessException("Booking already cancelled");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        RideSchedule schedule = booking.getRideSchedule();
        schedule.setBookedSeats(Math.max(0, safeBooked(schedule) - 1));
        scheduleRepository.save(schedule);
    }

    @Override
    public List<TripBookingResponse> getBookingsForTrip(Long tripId, Long driverId) {
        RideSchedule schedule = scheduleRepository.findById(tripId)
                .orElseThrow(() -> new BusinessException("Trip not found"));
        if (!schedule.getDriver().getId().equals(driverId)) {
            throw new BusinessException("Not authorised to view bookings for this trip");
        }
        return bookingRepository.findByRideScheduleIdOrderByCreatedAtAsc(tripId)
                .stream().map(b -> toBookingResponse(b, schedule)).toList();
    }

    @Override
    public List<TripBookingResponse> getMyBookings(Long passengerId) {
        return bookingRepository.findByPassengerIdOrderByCreatedAtDesc(passengerId)
                .stream().map(b -> toBookingResponse(b, b.getRideSchedule())).toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private int safeBooked(RideSchedule s) {
        return s.getBookedSeats() != null ? s.getBookedSeats() : 0;
    }

    private <T> T orDefault(T value, T fallback) {
        return value != null ? value : fallback;
    }

    private Point makePoint(double lng, double lat) {
        return GF.createPoint(new Coordinate(lng, lat));
    }

    private double computeDistanceKm(List<List<Double>> coords) {
        double total = 0;
        for (int i = 0; i < coords.size() - 1; i++) {
            List<Double> a = coords.get(i);
            List<Double> b = coords.get(i + 1);
            total += haversineKm(a.get(1), a.get(0), b.get(1), b.get(0)); // lat, lng
        }
        return total;
    }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private TripResponse toTripResponse(RideSchedule s) {
        int booked = safeBooked(s);

        List<List<Double>> routeGeometry = null;
        if (s.getRoute() != null && s.getRoute().getPath() != null) {
            LineString path = s.getRoute().getPath();
            routeGeometry = Arrays.stream(path.getCoordinates())
                    .map(c -> Arrays.asList(c.x, c.y)) // [lng, lat]
                    .collect(Collectors.toList());
        }

        return TripResponse.builder()
                .id(s.getId())
                .driverId(s.getDriver().getId())
                .driverName(s.getDriver().getName())
                .driverRating(s.getDriver().getRating())
                .vehicleId(s.getVehicle() != null ? s.getVehicle().getId() : null)
                .vehicleNumber(s.getVehicle() != null ? s.getVehicle().getVehicleNumber() : null)
                .vehicleCapacity(s.getVehicle() != null ? s.getVehicle().getCapacity() : null)
                .pickupLat(s.getPickupLocation() != null ? s.getPickupLocation().getY() : null)
                .pickupLng(s.getPickupLocation() != null ? s.getPickupLocation().getX() : null)
                .pickupLabel(s.getPickupLabel())
                .dropoffLat(s.getDropoffLocation() != null ? s.getDropoffLocation().getY() : null)
                .dropoffLng(s.getDropoffLocation() != null ? s.getDropoffLocation().getX() : null)
                .dropoffLabel(s.getDropoffLabel())
                .fare(s.getFare())
                .departureTime(s.getDepartureTime())
                .availableSeats(s.getAvailableSeats())
                .bookedSeats(booked)
                .seatsLeft(s.getAvailableSeats() - booked)
                .status(s.getStatus() != null ? s.getStatus().name() : null)
                .genderPreference(s.getGenderPreference() != null ? s.getGenderPreference().name() : null)
                .recurringDays(s.getRecurringDays())
                .routeId(s.getRoute() != null ? s.getRoute().getId() : null)
                .routeGeometry(routeGeometry)
                .build();
    }

    private TripBookingResponse toBookingResponse(TripBooking b, RideSchedule s) {
        return TripBookingResponse.builder()
                .id(b.getId())
                .tripId(s.getId())
                .driverId(s.getDriver() != null ? s.getDriver().getId() : null)
                .driverName(s.getDriver() != null ? s.getDriver().getName() : null)
                .passengerId(b.getPassenger() != null ? b.getPassenger().getId() : null)
                .passengerName(b.getPassenger() != null ? b.getPassenger().getName() : null)
                .vehicleNumber(s.getVehicle() != null ? s.getVehicle().getVehicleNumber() : null)
                .pickupLat(b.getPickupLat())
                .pickupLng(b.getPickupLng())
                .pickupLabel(b.getPickupLabel())
                .dropoffLat(b.getDropoffLat())
                .dropoffLng(b.getDropoffLng())
                .dropoffLabel(b.getDropoffLabel())
                .fare(s.getFare())
                .departureTime(s.getDepartureTime())
                .status(b.getStatus())
                .tripStatus(s.getStatus() != null ? s.getStatus().name() : null)
                .createdAt(b.getCreatedAt())
                .build();
    }
}
