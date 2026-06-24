package com.carpooling.service;

import com.carpooling.dto.request.BookTripRequest;
import com.carpooling.dto.request.PublishTripRequest;
import com.carpooling.dto.response.TripBookingResponse;
import com.carpooling.dto.response.TripResponse;

import java.time.LocalDate;
import java.util.List;

public interface TripService {
    TripResponse publishTrip(Long driverId, PublishTripRequest request);
    List<TripResponse> getTripFeed(Long userId, LocalDate date, Integer minSeats,
                                   Double pickupLat, Double pickupLng,
                                   Double dropoffLat, Double dropoffLng,
                                   Double radiusMeters);
    TripResponse getTripById(Long tripId);
    List<TripResponse> getDriverTrips(Long driverId);
    TripBookingResponse bookSeat(Long tripId, Long passengerId, BookTripRequest request);
    void cancelBooking(Long tripId, Long bookingId, Long userId);
    List<TripBookingResponse> getBookingsForTrip(Long tripId, Long driverId);
    List<TripBookingResponse> getMyBookings(Long passengerId);
}
