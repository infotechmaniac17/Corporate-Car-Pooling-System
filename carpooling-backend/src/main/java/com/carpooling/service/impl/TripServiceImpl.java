package com.carpooling.service.impl;

import com.carpooling.common.exception.BusinessException;
import com.carpooling.dto.request.BookTripRequest;
import com.carpooling.dto.request.PublishTripRequest;
import com.carpooling.dto.response.TripBookingResponse;
import com.carpooling.dto.response.TripResponse;
import com.carpooling.entity.RideSchedule;
import com.carpooling.entity.TripBooking;
import com.carpooling.entity.User;
import com.carpooling.entity.Vehicle;
import com.carpooling.enums.ScheduleStatus;
import com.carpooling.enums.VerificationStatus;
import com.carpooling.repository.RideScheduleRepository;
import com.carpooling.repository.TripBookingRepository;
import com.carpooling.repository.UserRepository;
import com.carpooling.repository.VehicleRepository;
import com.carpooling.service.TripService;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final RideScheduleRepository scheduleRepository;
    private final TripBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

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

        schedule = scheduleRepository.save(schedule);
        return toTripResponse(schedule);
    }

    @Override
    public List<TripResponse> getTripFeed(Long userId, LocalDate date, Integer minSeats) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        if (user.getOrganisation() == null) {
            throw new BusinessException("User has no organisation");
        }
        Long orgId = user.getOrganisation().getId();

        OffsetDateTime dateStart = date != null ? date.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime dateEnd   = date != null ? date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC) : null;

        return scheduleRepository.findOrgTripFeed(orgId, OffsetDateTime.now(), date, dateStart, dateEnd)
                .stream()
                .filter(s -> !s.getDriver().getId().equals(userId))
                .filter(s -> {
                    int left = s.getAvailableSeats() - safeBooked(s);
                    return minSeats == null ? left > 0 : left >= minSeats;
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

    private TripResponse toTripResponse(RideSchedule s) {
        int booked = safeBooked(s);
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
