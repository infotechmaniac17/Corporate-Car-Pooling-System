# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

```
carpooling-backend/   Spring Boot 3.3 + Java 21 REST API
carpooling-frontend/  React 18 + Vite 5 SPA
MD files/             Architecture notes and update logs
```

---

## Commands

### Frontend
```bash
cd carpooling-frontend
npm run dev       # dev server on :5173
npm run build     # production build to dist/
npm run preview   # serve dist/ locally
```

Install with `--legacy-peer-deps` — react-leaflet has a peer dep conflict with React 18:
```bash
npm install --legacy-peer-deps
```

### Backend
```bash
cd carpooling-backend
mvn spring-boot:run          # run with hot-reload
mvn clean package            # build fat JAR → target/
mvn clean package -DskipTests
java -jar target/carpooling-backend-*.jar
```

The backend starts on **port 8081**, context path `/api`. All endpoints are at `http://localhost:8081/api/...`.

> The `vite.config.js` proxy block (`/api → :8080`) is unused — the frontend `api/client.js` calls `http://localhost:8081/api` directly.

### Database
No migration tool (Flyway/Liquibase). Run scripts manually in order:
```
carpooling-backend/src/main/resources/db/migration_v3.sql
...
migration_v13.sql   ← latest
seed_super_admin.sql
seed_demo.sql       ← optional demo data
```
Requires PostgreSQL 16 with PostGIS enabled on `localhost:5432`, database `carpool_db`.

---

## Architecture

### Frontend

**Entry:** `src/main.jsx` → `App.jsx` (React Router routes) → `AuthProvider`

**Key layers:**

| Layer | Path | Purpose |
|---|---|---|
| API client | `src/api/client.js` | Axios instance, JWT inject, auto-refresh on 401 |
| API modules | `src/api/*.js` | One file per domain (rides, trips, matching, sos…) |
| Auth state | `src/context/AuthContext.jsx` | Global user/token, login/logout, mode switching |
| Screens | `src/screens/` | Full-page components, role-split (rider vs driver) |
| Admin | `src/admin/` | Super-admin and org-admin panel screens |
| Components | `src/components/` | Reusable UI (prefixed `Wp*` for design system) |
| Hooks | `src/hooks/` | `useIsDesktop`, `useUserActivity`, STOMP streaming hooks |

**Auth flow:** JWT (15 min) + refresh token stored in `localStorage` (`wp_token`, `wp_refresh_token`, `wp_user`). `AuthContext` proactively refreshes 2 min before expiry. On refresh failure, fires `auth:force-logout` custom event which `AuthContext` listens for to clear state.

**Mode switching:** Users with `BOTH` role can switch between `rider` / `driver` modes. `activeMode` is read from `AuthContext` — screens branch on `activeMode === 'driver'`.

**Dual data models — important:**
- `RideSchedule` / `RideRequest` — original driver-offers / passenger-requests model (used in `MatchingScreen`, driver inbox, older flows)
- `RideSchedule` / `TripBooking` / `TripController` — publish-then-discover model: driver publishes a `RideSchedule`; passengers browse `TripFeedScreen` and book via `TripBooking`. Surfaces in `TripFeedScreen`, `TripDetailScreen`, `PassengerTripsScreen`, `DriverMyRidesScreen`, `DriverTripBookingsScreen`.

Both coexist. Don't conflate them.

**Key screens (current):**

| Screen | Route | Role |
|---|---|---|
| `HomeScreen` | `/home` | Rider/driver home with quick-action sections |
| `TripFeedScreen` | `/trips` | Passenger browses published rides |
| `TripDetailScreen` | `/trips/:tripId` | Passenger views ride detail + books |
| `PassengerTripsScreen` | `/my-trips` | Passenger trip history / active bookings |
| `DriverMyRidesScreen` | `/driver/my-rides` | Driver's published rides list |
| `DriverTripBookingsScreen` | `/driver/trips/:tripId/bookings` | Driver views who booked a specific trip |
| `DriverOfferRideScreen` | `/driver/offer-ride` | Driver publishes a new ride (supports recurring) |
| `DriverInboxScreen` | `/driver/inbox` | Driver sees RideRequests (old matching model) |
| `MatchingScreen` | `/match` | Passenger searches via old matching model |
| `TrackingScreen` | `/tracking/:rideId` | Live GPS tracking |
| `DriverBackupRidesScreen` | `/driver/backup-rides` | Backup ride management |

**Key components (current):**

| Component | Purpose |
|---|---|
| `AppShell` | Desktop sidebar + nav wrapper |
| `WpBottomNav` | Mobile bottom nav bar |
| `WpToast` | Transient notification toast |
| `AddressInput` | Google Places / Mapbox autocomplete input |
| `LocationPickerMap` | Full-screen map for picking a lat/lng (lazy-loaded) |
| `EmbeddedMap` | Inline read-only map with markers (lazy-loaded) |
| `RoutePreviewMap` | Map showing a polyline route (lazy-loaded) |
| `RouteDisplay` | Text route summary (origin → destination, no map) |
| `RideDetailSheet` | Bottom sheet for ride details (old matching model) |
| `BookingDetailSheet` | Bottom sheet for TripBooking details |

**Activity tracking:** `useUserActivity` hook tracks idle/active state, passed as `activityState` prop to screens that need it (`HomeScreen`, `ProfileScreen`, `DriverOfferRideScreen`). Calls `src/api/activity.js`.

**Real-time:** STOMP over SockJS (`@stomp/stompjs` + `sockjs-client`). `global: 'globalThis'` in `vite.config.js` is required for SockJS. Hooks: `useDriverLocationStream`, `useTrackingSubscription`.

**Maps:** Leaflet used imperatively (`useRef` + `useEffect` + `import('leaflet')`). **Do not use `react-leaflet` hooks or JSX** — `react-leaflet` v5's `Context.Consumer` is incompatible with React 18. `LocationPickerMap`, `EmbeddedMap`, and `RoutePreviewMap` are lazy-loaded. `RouteDisplay` renders a static route summary without a map instance.

**Styling:** CSS custom properties defined in `src/tokens.css`. No CSS-in-JS framework. Inline styles everywhere using `var(--token-name)`. Responsive via `useIsDesktop` hook (breakpoint: 900px).

### Backend

**Entry:** `CarpoolingApplication.java` (`@SpringBootApplication`, `@EnableScheduling`)

**Package structure:**
```
config/       Security, JWT filter, WebSocket STOMP config, rate limiting
controller/   REST endpoints (thin — delegate to service)
service/      Business logic (interface + impl/ pattern throughout)
entity/       JPA entities (Hibernate Spatial for PostGIS types)
dto/          request/ and response/ DTOs
repository/   Spring Data JPA repos
enums/        All enum types
scheduler/    @Scheduled tasks (ride expiry, cleanup)
common/       ApiResponse<T> wrapper, exception hierarchy
```

**Response envelope:** All controllers return `ApiResponse<T>` — `{ success, message, data }`.

**Security:** `JwtAuthFilter` validates Bearer tokens on every request. `SecurityConfig` defines public routes (auth endpoints, OTP, file serving). `AuthRateLimitFilter` throttles auth endpoints.

**Geospatial:** PostGIS via Hibernate Spatial. Entities use `org.locationtech.jts.geom.Point` / `LineString`. Key spatial operations:
- `ST_DWithin(geography, geography, meters)` — proximity search (matching engine)
- `ST_Distance` — distance calculation
- `ST_MakeLine` — route construction
- Always use `GEOGRAPHY(Point, 4326)` for lat/lng points, `GEOMETRY(LineString, 4326)` for routes.

**Ride lifecycle:** `CREATED → ACTIVE → STARTED → COMPLETED` or `→ CANCELLED`. All transitions must write a `RideEvent` row.

**Matching engine** (`MatchingServiceImpl`): radius search → route overlap check → detour % → seat/gender filters → sort by distance/rating/time.

**Trip / publish-then-discover** (`TripController` → `TripServiceImpl`): drivers publish `RideSchedule` (with optional `recurring_days`); passengers book via `TripBooking`. `migration_v13.sql` adds `booked_seats` + `recurring_days` to `ride_schedules` and creates `trip_bookings` table. Booking status: `CONFIRMED → CANCELLED`.

**Backup driver:** `BackupRide` entity, states `PENDING → ACTIVATED → USED → EXPIRED`. Activated when primary driver cancels or goes unresponsive.

**Payments:** Razorpay (`razorpay-java`). Credentials via env vars `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Transaction states: `INITIATED → SUCCESS → FAILED → REFUNDED`.

**Email / OTP:** Gmail SMTP via Spring Mail. OTP config: 6-digit, 10 min expiry, 5 max attempts, 60 s cooldown.

**File storage:** `LocalFileStorageServiceImpl` — profile photos/vehicle docs stored locally. `FileController` serves them.

**WebSocket topics:**
- `/topic/ride/{rideId}/location` — driver location pings
- `/topic/ride/{rideId}/chat` — chat messages
- `/topic/ride/{rideId}/events` — ride lifecycle events

---

## Environment

**Frontend** (`.env`):
```
VITE_GOOGLE_PLACES_KEY=   # Google Places (New) API key — address autocomplete + reverse geocode
VITE_MAPBOX_TOKEN=        # Mapbox token — fallback geocoding, map tiles (optional)
```
Address autocomplete prefers Google if key present, falls back to Mapbox, falls back to manual entry.

**Backend** (`application.yml`):
```
spring.datasource.*      # PostgreSQL connection
spring.mail.*            # Gmail SMTP credentials
jwt.secret               # HMAC-SHA key (change in production)
razorpay.*               # Payment gateway keys
```
