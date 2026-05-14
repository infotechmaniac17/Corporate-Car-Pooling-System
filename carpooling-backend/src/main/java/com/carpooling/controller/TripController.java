package com.carpooling.controller;

import com.carpooling.common.ApiResponse;
import com.carpooling.config.JwtUtil;
import com.carpooling.dto.request.BookTripRequest;
import com.carpooling.dto.request.PublishTripRequest;
import com.carpooling.dto.response.TripBookingResponse;
import com.carpooling.dto.response.TripResponse;
import com.carpooling.service.TripService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<ApiResponse<TripResponse>> publishTrip(
            @Valid @RequestBody PublishTripRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(tripService.publishTrip(extractUserId(httpRequest), request)));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getTripFeed(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer minSeats,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(
                tripService.getTripFeed(extractUserId(httpRequest), date, minSeats)));
    }

    @GetMapping("/driver/published")
    public ResponseEntity<ApiResponse<List<TripResponse>>> getDriverTrips(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(tripService.getDriverTrips(extractUserId(httpRequest))));
    }

    @GetMapping("/bookings/my")
    public ResponseEntity<ApiResponse<List<TripBookingResponse>>> getMyBookings(HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(tripService.getMyBookings(extractUserId(httpRequest))));
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<ApiResponse<TripResponse>> getTripById(@PathVariable Long tripId) {
        return ResponseEntity.ok(ApiResponse.ok(tripService.getTripById(tripId)));
    }

    @GetMapping("/{tripId}/bookings")
    public ResponseEntity<ApiResponse<List<TripBookingResponse>>> getTripBookings(
            @PathVariable Long tripId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.ok(
                tripService.getBookingsForTrip(tripId, extractUserId(httpRequest))));
    }

    @PostMapping("/{tripId}/book")
    public ResponseEntity<ApiResponse<TripBookingResponse>> bookSeat(
            @PathVariable Long tripId,
            @RequestBody BookTripRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(tripService.bookSeat(tripId, extractUserId(httpRequest), request)));
    }

    @DeleteMapping("/{tripId}/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable Long tripId,
            @PathVariable Long bookingId,
            HttpServletRequest httpRequest) {
        tripService.cancelBooking(tripId, bookingId, extractUserId(httpRequest));
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled", null));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
