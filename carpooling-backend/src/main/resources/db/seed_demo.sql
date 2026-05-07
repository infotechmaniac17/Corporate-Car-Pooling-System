-- =============================================================
-- Demo seed data for dissertation testing.
-- Run AFTER migrations v1-v6 applied.
-- One user per major test case. All passwords = "password"
-- BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =============================================================

-- Wipe existing demo data (safe — only deletes rows tied to acme.com)
DELETE FROM ride_passengers WHERE ride_id IN (SELECT id FROM ride_schedules WHERE driver_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com'));
DELETE FROM ride_requests   WHERE passenger_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com');
DELETE FROM chat_messages   WHERE ride_id IN (SELECT id FROM ride_schedules WHERE driver_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com'));
DELETE FROM ride_schedules  WHERE driver_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com');
DELETE FROM vehicles        WHERE driver_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com');
DELETE FROM ratings         WHERE given_by  IN (SELECT id FROM users WHERE email LIKE '%@acme.com')
                               OR given_to  IN (SELECT id FROM users WHERE email LIKE '%@acme.com');
DELETE FROM guardian_contacts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@acme.com');
DELETE FROM users           WHERE email LIKE '%@acme.com';
DELETE FROM organisations   WHERE domain = 'acme.com';

-- =============================================================
-- Organisation
-- =============================================================
INSERT INTO organisations (id, name, domain, created_at, updated_at)
VALUES (9001, 'Acme Corp', 'acme.com', now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Users (14 total — one per test case)
-- Pune coords: Hinjewadi Ph1 (18.5912,73.7389) | Magarpatta (18.5167,73.9286)
-- Baner (18.5599,73.7849) | Kharadi (18.5519,73.9404)
-- Aundh (18.5614,73.8077) | Wakad (18.5979,73.7644)
-- =============================================================

INSERT INTO users (id, organisation_id, name, email, phone, gender, role, rating, password_hash,
                   is_online, is_deleted, is_read, driver_status, passenger_status,
                   home_address, home_lat, home_lng, created_at, updated_at) VALUES

-- 1) Brand-new user, no role flow done
(9101, 9001, 'New User',          'new@acme.com',                '+919000000001', 'MALE',
 'PASSENGER', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'NONE',
 NULL, NULL, NULL, now(), now()),

-- 2) Driver, approved, NO vehicle yet (test vehicle-add flow)
(9102, 9001, 'Driver No Vehicle', 'driver_new@acme.com',         '+919000000002', 'MALE',
 'DRIVER', 4.50, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Hinjewadi Phase 1, Pune', 18.5912, 73.7389, now(), now()),

-- 3) Driver with active vehicle, NO rides (test offer-ride flow)
(9103, 9001, 'Driver Ready',      'driver_ready@acme.com',       '+919000000003', 'MALE',
 'DRIVER', 4.80, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Baner, Pune', 18.5599, 73.7849, now(), now()),

-- 4) Driver with vehicle + 1 CREATED ride (passenger search should find this)
(9104, 9001, 'Driver Offering',   'driver_offering@acme.com',    '+919000000004', 'MALE',
 'DRIVER', 4.60, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Hinjewadi Phase 1, Pune', 18.5912, 73.7389, now(), now()),

-- 5) Driver with STARTED ride + active passenger (test chat/track/call)
(9105, 9001, 'Driver Started',    'driver_started@acme.com',     '+919000000005', 'MALE',
 'DRIVER', 4.90, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Wakad, Pune', 18.5979, 73.7644, now(), now()),

-- 6) Driver with completed ride history (test ratings)
(9106, 9001, 'Driver Veteran',    'driver_completed@acme.com',   '+919000000006', 'MALE',
 'DRIVER', 4.75, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Aundh, Pune', 18.5614, 73.8077, now(), now()),

-- 7) Female driver with FEMALE-only ride (test gender filter)
(9107, 9001, 'Driver Priya',      'driver_female@acme.com',      '+919000000007', 'FEMALE',
 'DRIVER', 4.85, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'NONE',
 'Hinjewadi Phase 2, Pune', 18.5891, 73.7350, now(), now()),

-- 8) Passenger, fresh, no requests (test empty matching screen)
(9108, 9001, 'Passenger Fresh',   'passenger_new@acme.com',      '+919000000008', 'MALE',
 'PASSENGER', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 NULL, NULL, NULL, now(), now()),

-- 9) Passenger with home address set (test prefill on matching)
(9109, 9001, 'Passenger Saved',   'passenger_searching@acme.com','+919000000009', 'MALE',
 'PASSENGER', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 'Hinjewadi Phase 1, Pune', 18.5912, 73.7389, now(), now()),

-- 10) Passenger with PENDING request to driver_offering (test request status UI)
(9110, 9001, 'Passenger Pending', 'passenger_pending@acme.com',  '+919000000010', 'MALE',
 'PASSENGER', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 'Baner, Pune', 18.5599, 73.7849, now(), now()),

-- 11) Passenger ACTIVE on driver_started's ride (test in-ride chat/call/track)
(9111, 9001, 'Passenger Active',  'passenger_active@acme.com',   '+919000000011', 'MALE',
 'PASSENGER', 4.70, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 'Wakad, Pune', 18.5979, 73.7644, now(), now()),

-- 12) Passenger with completed rides + given ratings
(9112, 9001, 'Passenger Done',    'passenger_completed@acme.com','+919000000012', 'MALE',
 'PASSENGER', 4.80, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 'Aundh, Pune', 18.5614, 73.8077, now(), now()),

-- 13) BOTH role user (test role switch toggle)
(9113, 9001, 'Both Roles',        'both@acme.com',               '+919000000013', 'MALE',
 'BOTH', 4.65, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'APPROVED', 'APPROVED',
 'Kharadi, Pune', 18.5519, 73.9404, now(), now()),

-- 14) Female passenger (matches female-only rides)
(9114, 9001, 'Passenger Anjali',  'passenger_female@acme.com',   '+919000000014', 'FEMALE',
 'PASSENGER', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'APPROVED',
 'Hinjewadi Phase 1, Pune', 18.5912, 73.7389, now(), now()),

-- 15) Admin
(9115, 9001, 'Admin User',        'admin@acme.com',              '+919000000015', 'MALE',
 'ADMIN', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 false, false, false, 'NONE', 'NONE',
 NULL, NULL, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Vehicles (one per active driver)
-- =============================================================
INSERT INTO vehicles (id, driver_id, vehicle_number, capacity, created_at, updated_at) VALUES
(9201, 9103, 'MH12AB1234', 4, now(), now()),  -- Driver Ready
(9202, 9104, 'MH12CD5678', 4, now(), now()),  -- Driver Offering
(9203, 9105, 'MH14EF9012', 5, now(), now()),  -- Driver Started
(9204, 9106, 'MH12GH3456', 4, now(), now()),  -- Driver Veteran
(9205, 9107, 'MH12IJ7890', 4, now(), now()),  -- Driver Priya
(9206, 9113, 'MH12KL2345', 4, now(), now())   -- Both Roles
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Ride Schedules
-- Status flow: CREATED -> ACTIVE -> STARTED -> COMPLETED
-- Hinjewadi (18.5912,73.7389) -> Magarpatta (18.5167,73.9286)
-- =============================================================
INSERT INTO ride_schedules (id, driver_id, vehicle_id, route_id, departure_time, available_seats,
                            detour_limit_percent, status, gender_preference,
                            pickup_location, pickup_label,
                            dropoff_location, dropoff_label,
                            fare, created_at, updated_at) VALUES

-- Ride A: CREATED — passenger search should find it
(9301, 9104, 9202, NULL,
 now() + interval '2 hours', 3, 20.00, 'CREATED', NULL,
 ST_SetSRID(ST_MakePoint(73.7389, 18.5912), 4326)::geography, 'Hinjewadi Phase 1, Pune',
 ST_SetSRID(ST_MakePoint(73.9286, 18.5167), 4326)::geography, 'Magarpatta City, Pune',
 120.00, now(), now()),

-- Ride B: STARTED — passenger_active is on it (chat/call/track tests)
(9302, 9105, 9203, NULL,
 now() - interval '30 minutes', 2, 20.00, 'STARTED', NULL,
 ST_SetSRID(ST_MakePoint(73.7644, 18.5979), 4326)::geography, 'Wakad, Pune',
 ST_SetSRID(ST_MakePoint(73.9404, 18.5519), 4326)::geography, 'Kharadi, Pune',
 150.00, now(), now()),

-- Ride C: COMPLETED — for rating history
(9303, 9106, 9204, NULL,
 now() - interval '2 days', 3, 20.00, 'COMPLETED', NULL,
 ST_SetSRID(ST_MakePoint(73.8077, 18.5614), 4326)::geography, 'Aundh, Pune',
 ST_SetSRID(ST_MakePoint(73.9286, 18.5167), 4326)::geography, 'Magarpatta City, Pune',
 130.00, now() - interval '2 days', now() - interval '2 days'),

-- Ride D: CREATED, FEMALE-only — gender filter test
(9304, 9107, 9205, NULL,
 now() + interval '3 hours', 3, 20.00, 'CREATED', 'FEMALE',
 ST_SetSRID(ST_MakePoint(73.7350, 18.5891), 4326)::geography, 'Hinjewadi Phase 2, Pune',
 ST_SetSRID(ST_MakePoint(73.9286, 18.5167), 4326)::geography, 'Magarpatta City, Pune',
 140.00, now(), now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Ride Passengers (active + completed)
-- =============================================================
INSERT INTO ride_passengers (id, ride_id, passenger_id, status, joined_at) VALUES
(9401, 9302, 9111, 'ACTIVE',    now() - interval '1 hour'),    -- passenger_active on Ride B
(9402, 9303, 9112, 'COMPLETED', now() - interval '2 days')     -- passenger_completed on Ride C
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Ride Requests
-- =============================================================
INSERT INTO ride_requests (id, ride_id, passenger_id, pickup_location, drop_location, status, created_at, updated_at) VALUES

-- Pending request from passenger_pending to driver_offering's Ride A
(9501, 9301, 9110,
 ST_SetSRID(ST_MakePoint(73.7849, 18.5599), 4326)::geography,
 ST_SetSRID(ST_MakePoint(73.9286, 18.5167), 4326)::geography,
 'PENDING', now(), now()),

-- Accepted request from passenger_active to driver_started's Ride B
(9502, 9302, 9111,
 ST_SetSRID(ST_MakePoint(73.7644, 18.5979), 4326)::geography,
 ST_SetSRID(ST_MakePoint(73.9404, 18.5519), 4326)::geography,
 'ACCEPTED', now() - interval '2 hours', now() - interval '1 hour'),

-- Completed request from passenger_completed for Ride C
(9503, 9303, 9112,
 ST_SetSRID(ST_MakePoint(73.8077, 18.5614), 4326)::geography,
 ST_SetSRID(ST_MakePoint(73.9286, 18.5167), 4326)::geography,
 'ACCEPTED', now() - interval '3 days', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- Chat messages (Ride B — driver_started <-> passenger_active)
-- =============================================================
INSERT INTO chat_messages (ride_id, sender_id, message, is_read, created_at) VALUES
(9302, 9105, 'Hi, I will be there in 5 min.',          true,  now() - interval '40 minutes'),
(9302, 9111, 'Sure, I am at the gate.',                true,  now() - interval '38 minutes'),
(9302, 9105, 'Reached. Black Innova MH14EF9012.',      true,  now() - interval '32 minutes'),
(9302, 9111, 'Coming down now, thanks!',               false, now() - interval '31 minutes');

-- =============================================================
-- Reset Postgres sequences past seeded IDs
-- =============================================================
SELECT setval('users_id_seq',          (SELECT MAX(id) FROM users));
SELECT setval('vehicles_id_seq',       (SELECT MAX(id) FROM vehicles));
SELECT setval('ride_schedules_id_seq', (SELECT MAX(id) FROM ride_schedules));
SELECT setval('ride_passengers_id_seq',(SELECT MAX(id) FROM ride_passengers));
SELECT setval('ride_requests_id_seq',  (SELECT MAX(id) FROM ride_requests));
SELECT setval('organisations_id_seq',  (SELECT MAX(id) FROM organisations));

-- =============================================================
-- DONE
-- =============================================================
-- Login email + password = "password" for ALL users
--
-- Test matrix:
--   new@acme.com                  -> first-time onboarding flow (no addr, no role done)
--   driver_new@acme.com           -> driver, must add vehicle before offering ride
--   driver_ready@acme.com         -> driver, vehicle exists, can post ride immediately
--   driver_offering@acme.com      -> has CREATED ride; sees pending request from passenger_pending
--   driver_started@acme.com       -> has STARTED ride; chat + call + tracking with passenger_active
--   driver_completed@acme.com     -> has COMPLETED ride history with rating
--   driver_female@acme.com        -> FEMALE-only ride; only female passengers see it
--   passenger_new@acme.com        -> empty matching screen, no addr
--   passenger_searching@acme.com  -> home addr set, prefilled in matching
--   passenger_pending@acme.com    -> PENDING request awaiting driver_offering accept
--   passenger_active@acme.com     -> on STARTED ride; can chat/call/track driver_started
--   passenger_completed@acme.com  -> rate driver_completed flow
--   both@acme.com                 -> role switch toggle test
--   passenger_female@acme.com     -> matches driver_female's FEMALE ride
--   admin@acme.com                -> admin dashboard
-- =============================================================
