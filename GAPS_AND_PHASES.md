# Corporate Carpooling — Gaps & Phased Roadmap

## Current Architecture Summary
- Pull-based matching: passenger requests → system finds driver
- Org-gated auth, admin approval, role requests
- Scheduled recurring rides (driver side)
- PostGIS proximity matching (endpoint-based, not waypoint)
- WebSocket: live tracking + chat
- Razorpay payments, SOS, ratings, backup driver pool
- Super admin: multi-org, offices, suspend/reactivate

---

## Core Architectural Shift (Pre-Phase)

**Switch from pull-based matching → publish-then-discover**

| Current | Target |
|---|---|
| Passenger requests ride → system matches driver | Driver publishes trip → passengers browse and book seats |
| Reactive, fails if no driver exists | Proactive, demand visible before departure |
| No seat capacity concept | Explicit seat count per trip |
| No trip feed/discovery | Trip feed scoped to org |

This is the foundational change. All phases build on top of it.

---

## Phase 1 — Core Ride Flow Redesign
**Goal:** Replace matching engine with publish-and-book model.

### 1.1 Driver Trip Publishing
- Driver creates a trip: origin, destination, date/time, available seats, recurring days (Mon/Wed/Fri etc.)
- Trip stored with status: OPEN, FULL, CANCELLED, COMPLETED
- Seat count tracked: `total_seats`, `booked_seats`
- Driver can edit/cancel before departure

### 1.2 Trip Discovery Feed (Passengers)
- Org-scoped feed — only trips within same organisation
- Filter by: office location, date, available seats
- Sort by: departure time, proximity to passenger address
- Login required — no public/unauthenticated access (corporate privacy)

### 1.3 Seat Booking Flow
- Passenger selects trip → books seat → booking confirmed
- Driver notified of new booking
- Seat count decrements on booking, increments on cancellation
- Booking statuses: PENDING, CONFIRMED, CANCELLED, COMPLETED

### 1.4 Waypoint-Based Route Matching
- Replace endpoint-only PostGIS proximity with waypoint matching
- Driver route stored as LineString (already in schema)
- Match passengers whose pickup/dropoff falls within N meters of any point on driver's route
- Detour % still enforced (keep existing logic, extend input)

### Backend Changes
- New entity: `Trip` (replaces `RideSchedule` or extends it)
- New entity: `TripBooking` (replaces `RideRequest`)
- `MatchingController` → `TripController` (publish, list, search)
- `RideRequestController` → `BookingController`
- PostGIS query: `ST_DWithin(route_line, passenger_point, radius)`

### Frontend Changes
- `DriverOfferRideScreen` → trip publishing form with seat count + recurring selector
- `MatchingScreen` → `TripFeedScreen` (browse list with filters)
- New `TripDetailScreen` (trip info + book button)
- `PassengerTripsScreen` → shows bookings not requests

---

## Phase 2 — Recurring Bookings & Notifications
**Goal:** Automate repeat commutes, add real-time alerts.

### 2.1 Recurring Booking Subscription
- Passenger books a recurring trip slot: "Book this driver every Mon-Wed-Fri indefinitely"
- System auto-creates booking instances per trip occurrence
- Passenger can cancel individual occurrence or entire subscription
- Driver sees recurring passengers separately from one-time bookings

### 2.2 Push / In-App Notifications
Trigger points:
- Booking confirmed/cancelled
- Driver published new trip matching passenger's usual route
- Seat opened on a full trip (waitlist notification)
- Driver en route (pre-ride ETA alert)
- Trip cancelled by driver
- Rating reminder post-trip

### Backend Changes
- New entity: `RecurringBookingSubscription`
- Scheduled job: generate booking instances from subscriptions weekly
- `NotificationController` — already exists, extend with new event types
- FCM or WebSocket push for mobile-style alerts

### Frontend Changes
- Recurring toggle on booking screen
- Notifications bell / drawer in AppBar
- Notification list screen

---

## Phase 3 — Driver ETA & Pre-Ride Tracking
**Goal:** Passenger sees driver approaching before pickup.

### 3.1 Pre-Ride Driver Location
- Driver starts "heading to pickup" → broadcasts location via WebSocket
- Passenger app shows driver pin moving on map before trip starts
- ETA calculated from driver location → passenger pickup point
- Status flow: `SCHEDULED → DRIVER_EN_ROUTE → IN_PROGRESS → COMPLETED`

### 3.2 Dynamic Trip Status
- Driver controls status: Start heading → Start ride → End ride
- Each status change triggers notification to all booked passengers
- Late driver detection: if driver hasn't moved 15 min before departure → alert passengers

### Backend Changes
- `TrackingController` extended: accept pre-ride location broadcasts
- New status `DRIVER_EN_ROUTE` in ride/trip status enum
- ETA computation endpoint: `GET /trips/{id}/eta?passengerId=`

### Frontend Changes
- `TrackingScreen` activated before trip starts (for booked passengers)
- Driver app: "Start heading" button on upcoming trip card
- ETA badge on trip detail screen

---

## Phase 4 — Waitlist & Capacity Management
**Goal:** No seat left behind, reduce trip abandonment.

### 4.1 Waitlist
- Trip full → passenger joins waitlist (ordered queue)
- Booking cancelled → first waitlisted passenger auto-notified, 30-min window to confirm
- If not confirmed → next in queue notified
- Driver can see waitlist count

### 4.2 Dynamic Seat Adjustment
- Driver can increase seat count post-publish (e.g., switched to bigger car)
- Decrease only if no confirmed bookings for those seats
- Seat increase triggers waitlist notification

### Backend Changes
- New entity: `TripWaitlist` (trip, user, position, notified_at)
- Scheduled job: process waitlist on cancellation
- `BookingController`: `POST /trips/{id}/waitlist`, `DELETE /trips/{id}/waitlist`

### Frontend Changes
- "Join Waitlist" button when trip is full
- Waitlist position indicator ("You are #2 in queue")
- Driver trip card shows waitlist count

---

## Phase 5 — Carbon Tracker & Corporate Reports
**Goal:** ESG reporting, corporate value-add, admin insights.

### 5.1 Carbon Savings Calculator
- Per trip: calculate CO2 saved vs. all passengers driving solo
- Formula: `(passenger_count × avg_car_emission × distance) - trip_emission`
- Show per-user lifetime savings on profile
- Org-level aggregate on admin dashboard

### 5.2 Ride History Export
- Org admin exports CSV: employee trips, dates, distances, cost, carbon savings
- Filter by: date range, office, department
- Super admin: cross-org platform export

### 5.3 Department/Team Grouping
- User profile has optional `department` field
- Trip feed filter: "Show trips from my department"
- Admin can group users by department, see department-level stats

### Backend Changes
- `CarbonService`: compute savings per trip on completion
- `carbon_savings` column on `Trip` entity
- `TripHistoryController`: export endpoint returning CSV stream
- `department` field on `User` entity + migration

### Frontend Changes
- Carbon badge on profile screen
- Carbon summary card on home screen
- Admin dashboard: carbon savings widget
- Export button on admin trip history page

---

## Phase 6 — Ride Preferences & Trust Features
**Goal:** Better matching quality, safer rides, reduce friction.

### 6.1 Ride Preferences
- Driver sets on trip: music (yes/no), AC, max detour willingness, chat/quiet
- Passenger sets profile preferences: same preferences
- Feed shows preference match indicators
- Not a hard filter — soft signal only

### 6.2 Late Cancel Penalty Tracking
- Track cancellation rate per user (driver + passenger)
- Threshold (e.g., >3 late cancels in 30 days) → flag to org admin
- Org admin sees flagged users, can warn or suspend
- Late = cancelled within 2 hours of departure

### 6.3 Anonymous Rating Reasons
- Post-ride rating includes optional reason tags: "Was late", "Bad driving", "No-show", "Great driver", "Friendly"
- Tags aggregated on profile (not individual reviews shown)
- Threshold of negative tags → admin alert

### Backend Changes
- `preferences` JSONB column on `Trip` and `User` entities
- `cancellation_count` + `late_cancel_count` on `User`
- `RatingTag` entity or JSONB tags on existing `Rating`

### Frontend Changes
- Preferences selector on trip publish screen
- Preference icons on trip feed cards
- Rating screen: tag chips below star rating

---

## What We Are NOT Changing
- Auth model (org-gated, admin approval) — keep
- Super admin (org management, offices, suspend) — keep
- SOS + guardian contacts — keep
- Backup driver system — evaluate if still needed post-phase-1
- Razorpay payments — keep, extend per-booking
- JWT + WebSocket infrastructure — keep

---

## Map Provider Note
BlaBlaCar uses **HERE Maps** (switched from Google Maps for cost + routing quality).
Current app uses **Google Maps/Places**.
Recommendation: stay on Google Maps for now — Places API for address input is already integrated. Revisit if API costs become significant at scale.

---

## Priority Sequence Summary

| Phase | Focus | Priority |
|---|---|---|
| Pre-Phase | Publish-then-discover architecture flip | Critical — blocks all phases |
| 1 | Core ride flow (publish, feed, book, waypoint match) | P0 |
| 2 | Recurring bookings + notifications | P1 |
| 3 | Driver ETA + pre-ride tracking | P1 |
| 4 | Waitlist + capacity management | P2 |
| 5 | Carbon tracker + corporate reports | P2 |
| 6 | Preferences + trust features | P3 |
