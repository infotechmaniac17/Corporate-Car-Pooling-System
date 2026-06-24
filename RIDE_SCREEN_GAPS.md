# Ride Screen Gaps & Fixes

## Critical — blocking correct behavior

- [x] **Fix 1** — Start Ride button never appears for new publish-model trips
  - `DriverMyRidesScreen` only shows button when `status === 'ACTIVE'`
  - New trips start at `CREATED`; no approval step auto-transitions them to `ACTIVE`
  - **Fix**: show Start Ride on `CREATED` too

- [x] **Fix 2** — Seats display shows total offered seats, not remaining
  - Was showing `ride.availableSeats` (e.g. "4 seats free") even with 3 booked
  - Also switched `DriverMyRidesScreen` from old `getSchedule` API → `getMyDriverTrips()` (new TripResponse has `seatsLeft`)
  - **Fix**: show `ride.seatsLeft`

- [x] **Fix 3** — `driverId` was `null` in passenger booking mapping → Rate screen broken
  - `TripBookingResponse` had no `driverId` field; mapping hardcoded `driverId: null`
  - Rate navigate `/rate/${rideId}?driverId=null` silently failed
  - **Fix**: added `driverId` to `TripBookingResponse` + `TripServiceImpl.toBookingResponse` + frontend mapping

- [x] **Fix 4** — No cancel button for confirmed bookings in PassengerTripsScreen
  - `handleCancelRequest` existed but only wired to old `pendingRequests` section (always empty)
  - TripCard had no cancel prop
  - **Fix**: added cancel button to TripCard for non-started, non-completed bookings

- [x] **Fix 5** — No screen for driver to see who booked their trip
  - "View requests" went to old DriverInboxScreen (request-based flow)
  - New booking model uses `GET /trips/{tripId}/bookings` but no UI for it
  - **Fix**: created `DriverTripBookingsScreen.jsx`, route `/driver/trips/:tripId/bookings`

---

## Medium — UX and sync

- [x] **Fix 6** — Departure countdown timer ("departs in 47 min")
  - New `useCountdown` hook — live ticks every 30s, shows for trips <2h away
  - `PassengerTripsScreen` + `DriverMyRidesScreen` both show countdown chip (urgent=red when ≤30min)

- [x] **Fix 7** — WebSocket real-time status sync on both screens
  - Backend: `RideScheduleServiceImpl.updateStatus` + `cancelSchedule` publish to `/topic/ride/{id}/events`
  - Frontend: new `useRideEventsSubscription` hook; both screens subscribe and call `load()` on event

- [x] **Fix 8** — "Trip started" push/toast notification to passengers
  - Backend: on STARTED, notifies each CONFIRMED `TripBooking` passenger via `NotificationService`
  - Frontend: `PassengerTripsScreen` WS event → shows toast; `AppShell` WS → increments badge in real-time
  - Added `RIDE_STARTED` to `NotificationType` enum

- [x] **Fix 9** — Driver cancel cascades to all `TripBooking` records
  - `cancelSchedule` now cancels all CONFIRMED `TripBooking` rows + sends `RIDE_CANCELLED` notification per passenger

- [x] **Fix 10** — Pre-ride chat (message driver before trip starts)
  - Backend: `ChatServiceImpl` guards relaxed — blocks only COMPLETED/CANCELLED (was ACTIVE+STARTED only)
  - Frontend: Chat button now shows for UPCOMING + IMMINENT + LIVE bookings (not just LIVE)

---

## Lower — nice-to-have

- [ ] **Fix 11** — Passenger can update pickup point after booking
- [ ] **Fix 12** — Driver sees passenger pickup pins on mini-map per ride card
- [ ] **Fix 13** — Auto-expire / close trips past departure time with no action
- [ ] **Fix 14** — "No-show" flag per passenger (driver marks who didn't show up)
