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

### 2.1 Notification system (currently absent)
- No in-app notifications, no push (FCM), no SMS. Nothing notifies a passenger that a request was accepted/rejected, a driver of a new request (inbox is manual refresh), a backup driver of activation, payment success/refund, ride cancelled, SOS.
- **Fix:** `notifications` table + entity + `NotificationService`; WebSocket topic `/topic/user/{id}/notifications`; optional FCM/SMS adapters. This unblocks 1.3, 2.2, 2.3.

### 2.2 Backup driver system incomplete
- `BackupRide` has no status field. Architecture states `PENDING → ACTIVATED → USED → EXPIRED`; current code just deletes the row on activation.
- Activation is **manual only** (`activateNextBackupDriver`). No detection of "driver unresponsive" / no-show timeout.
- No notification to the promoted backup driver. No driver-side UI to view/accept backup assignments.
- **Fix:** add status enum + transitions, a scheduled job for unresponsive-driver detection, notifications, driver UI.

### 2.3 Ratings — backend exists, no rider/driver UI
- `RatingController` + `api/ratings.js` exist and admin dashboard uses them, but there is **no post-ride rating screen** for passengers/drivers and no route for it. Architecture wants both parties to rate each other after completion.
- **Fix:** rating screen triggered on ride COMPLETED; show aggregate rating on profiles / matching cards.

### 2.4 Guardian contacts — backend exists, no UI
- `GuardianContactController` exists; no management screen. Users can't add/edit guardian contacts, so SOS has no recipients.
- **Fix:** guardian contacts CRUD screen under Profile.

### 2.5 Matching engine depth
- `MatchingServiceImpl` does Haversine pre-filter + detour % against driver `LineString` **endpoints only** — not true route-corridor overlap (`ST_DWithin` on the line, or buffer intersection).
- Timing/departure-window matching and gender-preference filtering should be verified against the architecture's sort criteria (distance, rating, timing).
- No `matching_logs` (architecture: optional) — useful for debugging match quality.
- **Fix:** corridor-based overlap, explicit time-window filter, optional matching_logs.

### 2.6 Scheduled jobs (none exist)
- Nothing expires stale `ride_requests`, auto-completes past-departure rides, expires backup offers, or cleans old location pings.
- **Fix:** `@Scheduled` tasks for each.

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
