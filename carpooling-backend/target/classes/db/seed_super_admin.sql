-- =============================================================
-- Super-admin + org patch — run AFTER migration_v7.sql
-- =============================================================

-- ── 1. Platform org (for SUPER_ADMIN — not a real company) ────
INSERT INTO organisations (id, name, domain, office_address, office_lat, office_lng, status, created_at, updated_at)
VALUES (1, 'Waypoint Platform', 'waypoint.io', NULL, NULL, NULL, 'ACTIVE', now(), now())
ON CONFLICT (id) DO UPDATE SET
    name           = EXCLUDED.name,
    domain         = EXCLUDED.domain,
    status         = EXCLUDED.status,
    updated_at     = now();

-- ── 2. SUPER_ADMIN user ────────────────────────────────────────
-- email    : superadmin@waypoint.io
-- password : password
-- BCrypt   : $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (id, organisation_id, name, email, phone, gender, role,
                   rating, password_hash, is_online, is_deleted, is_read,
                   driver_status, passenger_status, created_at, updated_at)
VALUES (1,
        1,
        'Super Admin',
        'superadmin@waypoint.io',
        '+919999999999',
        'MALE',
        'SUPER_ADMIN',
        NULL,
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        false, false, false,
        'NONE', 'NONE',
        now(), now())
ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    email         = EXCLUDED.email,
    phone         = EXCLUDED.phone,
    role          = 'SUPER_ADMIN',
    password_hash = EXCLUDED.password_hash,
    updated_at    = now();

-- ── 3. Activate Acme Corp + set office address ────────────────
UPDATE organisations
SET office_address = 'Magarpatta City, Hadapsar, Pune',
    office_lat     = 18.5167,
    office_lng     = 73.9286,
    status         = 'ACTIVE',
    updated_at     = now()
WHERE id = 9001;

-- ── 4. Give admin user (9115) the office address too ─────────
UPDATE users
SET secondary_address = 'Magarpatta City, Hadapsar, Pune',
    secondary_lat     = 18.5167,
    secondary_lng     = 73.9286
WHERE id = 9115;

-- ── Reset sequences ───────────────────────────────────────────
SELECT setval('users_id_seq',         GREATEST((SELECT MAX(id) FROM users), 9200));
SELECT setval('organisations_id_seq', GREATEST((SELECT MAX(id) FROM organisations), 9100));

-- =============================================================
-- Credentials summary
-- =============================================================
-- superadmin@waypoint.io  / password  → SUPER_ADMIN
-- admin@acme.com          / password  → ADMIN  (Acme Corp)
-- (all acme.com users unchanged — see seed_demo.sql)
-- =============================================================
