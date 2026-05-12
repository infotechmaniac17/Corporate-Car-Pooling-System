# Implementation Gaps — Phased Backlog

Date: 2026-05-12. Snapshot of what is missing / stubbed vs the architecture in `architecture.md`. Grouped into phases by priority/risk.

---

## Phase 1 — Correctness & safety (do first)

### 1.1 Payment security (Razorpay)
- `PaymentServiceImpl.confirmPayment` trusts `razorpayOrderId` + `razorpayPaymentId` from the client with **no HMAC signature verification**. Anyone can mark a txn SUCCESS.
- No Razorpay webhook handler (`payment.captured` / `payment.failed`).
- `refund()` only flips status to `REFUNDED` locally — never calls Razorpay refund API.
- **Fix:** verify `razorpay_signature` with key-secret HMAC; add webhook endpoint; call real refund API.

### 1.2 Ride lifecycle audit (`ride_events`) ✅ DONE
- `RideEvent` entity + `RideEventRepository` created. `migration_v9.sql` adds `ride_events` table.
- `RideEventType` enum: SCHEDULE_CREATED, STATUS_ACTIVE/STARTED/COMPLETED/CANCELLED, REQUEST_ACCEPTED/REJECTED/CANCELLED, BACKUP_ACTIVATED, SOS_TRIGGERED.
- `RideScheduleServiceImpl`: logs on `createSchedule`, `updateStatus` (all transitions), `cancelSchedule`.
- `RideRequestServiceImpl`: logs on ACCEPTED / REJECTED transitions.

### 1.3 SOS is a no-op alert ✅ DONE
- `SosIncident` entity: added `status` (ACTIVE/RESOLVED), `resolvedAt`, `resolvedBy`. `migration_v11.sql` applies.
- `SosServiceImpl.notifyGuardians`: now sends real email via `EmailService.sendSosAlert` to guardian's email (if set). Still logs warn for phone (SMS not wired).
- `GuardianContact` entity: `email` field added. `migration_v11.sql` adds column.
- `SosService`/`SosServiceImpl`: added `resolveIncident(id, userId)` and `getAllActiveIncidents()`.
- `SosController`: added `PATCH /{id}/resolve` and `GET /active` — both `@PreAuthorize(ADMIN|SUPER_ADMIN)`.

### 1.4 Frontend screens showing mock data ✅ DONE
- `PaymentsScreen.jsx`: `MOCK_PAYMENTS` removed; wired to `GET /payments/my` via `api/payments.js`; loading skeleton + empty state added.
- `SosScreen.jsx`: `mockGuardians` const removed; fallback now `[]`; empty-state message shown when no guardians.
- `api/payments.js` created with `getMyTransactions`, `initiatePayment`, `confirmPayment`, `refundPayment`.

### 1.5 JWT hardening ✅ DONE
- Access token expiry reduced to 15 min (`application.yml`).
- `JwtAuthFilter`: checks `isSuspended` flag after token validation — returns 403 immediately if true.
- `AuthRateLimitFilter` (`@Component @Order(1)`): 20 req/15 min per IP on all `/auth/**`; 5/15 min on `/auth/send-otp` and `/auth/verify-otp`.
- `RefreshToken` entity + `RefreshTokenRepository` + `RefreshTokenService/Impl`. `migration_v10.sql` adds `refresh_tokens` table.
- `AuthController`: `POST /auth/refresh` (token rotation) and `POST /auth/logout` (revoke).
- Frontend: `api/client.js` 401 interceptor auto-calls refresh + retries; `api/auth.js` exports `refreshToken`/`logoutApi`; `AuthContext.jsx` stores/clears `wp_refresh_token`, calls `logoutApi` on logout.

### 1.6 Live tracking not wired end-to-end ✅ DONE
- Backend status gate fixed: `TrackingServiceImpl.recordPing` now allows `ACTIVE` or `STARTED`.
- `useDriverLocationStream` hook: `watchPosition` → throttled REST `POST /tracking/ping` (5s throttle). Auto-starts in `DriverMyRidesScreen` when any ride is `STARTED`.
- `DriverMyRidesScreen`: Start / End ride buttons added (`ACTIVE` → `STARTED` → `COMPLETED` via `PATCH /rides/schedules/{id}/status`). STARTED rides show `● LIVE` badge.
- `useTrackingSubscription` hook: STOMP over SockJS, subscribes `/topic/ride/{id}/location`; wired into `TrackingScreen`.
- `TrackingScreen`: replaced polling-only with WS subscription + initial REST fetch. Removed hardcoded mock fallbacks (`KA 01 AB 1234`, ETA 8, rating 4.8).
- Dependencies added: `@stomp/stompjs`, `sockjs-client`.

---

## Phase 2 — Core feature completeness

### 2.1 Notification system ✅ DONE
- `Notification` entity + `NotificationRepository` created. `migration_v12.sql` adds `notifications` table.
- `NotificationType` enum: REQUEST_RECEIVED, REQUEST_ACCEPTED, REQUEST_REJECTED, BACKUP_ACTIVATED, RIDE_CANCELLED, SOS_TRIGGERED, PAYMENT_SUCCESS, PAYMENT_REFUNDED.
- `NotificationService/Impl`: `send()` persists + pushes via `SimpMessagingTemplate` to `/topic/user/{id}/notifications`. WS push failures are swallowed (non-fatal).
- `NotificationController`: GET /notifications/my, GET /notifications/unread-count, PATCH /notifications/{id}/read, PATCH /notifications/read-all.
- `RideRequestServiceImpl`: notifies driver on REQUEST_RECEIVED; notifies passenger on REQUEST_ACCEPTED / REQUEST_REJECTED.
- `BackupDriverServiceImpl`: notifies driver on backup assignment and on promotion to primary.
- Frontend: `api/notifications.js`; `AppShell` sidebar shows bell with unread badge + dropdown panel polling every 30s.

### 2.2 Backup driver system ✅ DONE
- `BackupStatus` enum: PENDING, ACTIVATED, USED, EXPIRED.
- `BackupRide` entity: added `status` + `activatedAt` fields. `migration_v12.sql` adds columns.
- `BackupRideRepository`: added `findTopByRideScheduleIdAndStatusOrderByPriorityAsc`, `findByBackupDriverId`, `expirePendingBeforeDeparture`.
- `BackupDriverServiceImpl`: `activateNextBackupDriver` now transitions PENDING→ACTIVATED (no delete); sends BACKUP_ACTIVATED notification. `assignBackupDriver` notifies driver of new backup assignment.
- `DriverBackupController` at `/driver/backup-rides`: GET returns all backup assignments for authenticated driver.
- Frontend: `DriverBackupRidesScreen.jsx` — lists PENDING/ACTIVATED/EXPIRED backup rides; route `/driver/backup-rides`; added to driver sidebar nav.

### 2.3 Ratings ✅ DONE
- `RateRideScreen.jsx`: star picker (1–5), optional comment, submits to POST /ratings. Shows "Skip" button. Success state with confirmation.
- Route `/rate/:rideId?driverId=X` added in App.jsx. `PassengerTripsScreen` already navigates to this route on "Rate driver" button click.

### 2.4 Guardian contacts ✅ DONE
- `GuardianContactRequest`: added optional `email` field (`@Email`).
- `GuardianContactResponse`: added `email` field.
- `GuardianContactServiceImpl`: maps email in create and toResponse.
- Frontend: `api/guardians.js` + `GuardianContactsScreen.jsx` — list/add/delete contacts with name/phone/email/relation. Route `/guardians`. Link added in ProfileScreen under "Safety" section.

### 2.5 Matching engine depth ✅ DONE
- `MatchingServiceImpl`: replaced endpoint-only Haversine check with `distanceToSegmentMeters()` — equirectangular projection finds closest point on driver's A→B segment, then measures Haversine to that point. Passenger pickup must be within `searchRadiusMeters` of the route corridor (not just the pickup endpoint).
- Time-window filter (±1h) already existed. Gender preference filter already existed.
- `matching_logs` left as optional (Phase 3 if needed).

### 2.6 Scheduled jobs ✅ DONE
- `@EnableScheduling` added to `CarpoolingApplication`.
- `RideSchedulerService`: three `@Scheduled` tasks:
  1. `expireStaleRequests` — every 1h, cancels PENDING requests older than 24h.
  2. `autoCompleteExpiredRides` — every 30min, completes STARTED/ACTIVE rides 2h past departure.
  3. `expirePendingBackups` — every 30min, expires PENDING backup assignments past ride departure.

---

## Phase 3 — Operational / quality

### 3.1 Database migration management
- Raw `.sql` files (`schema.sql`, `migration_v2.sql`, `migration_email_verification.sql`, `migration_v8.sql`) applied by hand. `ddl-auto: validate`. No Flyway/Liquibase.
- **Fix:** adopt Flyway; convert existing migrations to versioned scripts.

### 3.2 Test coverage
- Only `tests/auth-flow.test.mjs` exists. No unit/integration tests for matching, payments, ride lifecycle, backup activation, suspension logic.
- **Fix:** JUnit + Testcontainers (PostGIS) for service-layer tests; expand the e2e suite.

### 3.3 Admin audit log
- Super-admin actions (suspend/reactivate org or user, add/remove admins, edit org, address sync) are not recorded.
- **Fix:** `admin_audit_log` table; or reuse `ride_events`-style generic event log.

### 3.4 Non-functional admin search bars
- `AdminDashboard.jsx` and `SuperAdminDashboard.jsx` have search `<input>`s with no `onChange`/filter wired (placeholders only).
- **Fix:** wire client-side filter or server search.

### 3.5 Misc
- Email change has no re-verification flow. Resend-OTP throttling should be confirmed in `EmailVerificationServiceImpl`.
- WebSocket STOMP connect auth (JWT on CONNECT frame) should be verified — if missing, anyone can subscribe to ride topics.
- `ride_location_pings` retention — pings stored forever, no TTL.
- File uploads (`FileController` / `LocalFileStorageServiceImpl`) — local disk only; no size/type validation review, no cloud storage for prod.

---

## Phase 4 — Future / out of current scope
- Mobile app (architecture lists as "future").
- `carpool-ai-agent/` — separate Python codegen orchestrator, not part of the running product; decide if it stays as tooling or is removed.
- Multi-currency / multi-region payments.
- Carbon-savings analytics dashboard (the project's stated purpose — CO2/traffic reduction metrics) — no reporting exists.

---

### Quick reference — what's already done
- Auth (JWT, email OTP verification, password reset), org/admin/super-admin management, multiple offices + address sync, user/org suspension, driver application + approval flow, ride schedules with state machine + transition validation, ride requests + passenger management, matching (basic), live tracking (WebSocket), chat (WebSocket, read flags), Razorpay order creation, ratings backend, SOS incident creation, backup driver assignment (manual), trip history, vehicles, role requests, user activity tracking.
