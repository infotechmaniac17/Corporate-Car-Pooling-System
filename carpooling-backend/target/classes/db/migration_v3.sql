-- =============================================================
-- Migration V3: Ride participants, payment ownership, constraints,
-- gender preference, driver availability, soft delete, waypoints
-- Run ONCE against carpooling_db after migration_v2.sql
-- =============================================================

-- ---------------------------------------------------------------
-- 1. passenger_status enum
-- ---------------------------------------------------------------
CREATE TYPE passenger_status AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

-- ---------------------------------------------------------------
-- 2. Add STARTED to schedule_status enum
-- ---------------------------------------------------------------
ALTER TYPE schedule_status ADD VALUE IF NOT EXISTS 'STARTED';

-- ---------------------------------------------------------------
-- 3. ride_passengers table
-- ---------------------------------------------------------------
CREATE TABLE ride_passengers (
    id           BIGSERIAL PRIMARY KEY,
    ride_id      BIGINT NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    passenger_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       passenger_status NOT NULL DEFAULT 'ACTIVE',
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ride_id, passenger_id)
);

CREATE INDEX idx_ride_passengers_ride      ON ride_passengers(ride_id);
CREATE INDEX idx_ride_passengers_passenger ON ride_passengers(passenger_id);

-- ---------------------------------------------------------------
-- 4. transactions.user_id — payment ownership
-- ---------------------------------------------------------------
ALTER TABLE transactions
    ADD COLUMN user_id BIGINT REFERENCES users(id);

CREATE INDEX idx_transactions_user ON transactions(user_id);

-- ---------------------------------------------------------------
-- 5. Prevent multiple active rides per driver
-- ---------------------------------------------------------------
CREATE UNIQUE INDEX unique_active_driver_ride
    ON ride_schedules(driver_id)
    WHERE status IN ('ACTIVE', 'STARTED');

-- ---------------------------------------------------------------
-- 6. Seat integrity constraint
-- ---------------------------------------------------------------
ALTER TABLE ride_schedules
    ADD CONSTRAINT seats_non_negative CHECK (available_seats >= 0);

-- ---------------------------------------------------------------
-- 7. Gender preference on ride
-- ---------------------------------------------------------------
ALTER TABLE ride_schedules
    ADD COLUMN gender_preference VARCHAR(20);

-- ---------------------------------------------------------------
-- 8. Driver online status
-- ---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------
-- 9. Ride cancellation reason
-- ---------------------------------------------------------------
ALTER TABLE ride_schedules
    ADD COLUMN cancel_reason TEXT;

-- ---------------------------------------------------------------
-- 10. route_waypoints table
-- ---------------------------------------------------------------
CREATE TABLE route_waypoints (
    id        BIGSERIAL PRIMARY KEY,
    route_id  BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    location  GEOGRAPHY(Point, 4326) NOT NULL,
    sequence  INT NOT NULL
);

CREATE INDEX idx_route_waypoints_route    ON route_waypoints(route_id);
CREATE INDEX idx_route_waypoints_location ON route_waypoints USING GIST(location);

-- ---------------------------------------------------------------
-- 11. Soft delete on users
-- ---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_active ON users(is_deleted) WHERE is_deleted = FALSE;

-- ---------------------------------------------------------------
-- 12. updated_at trigger for tables missing it
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['ride_schedules', 'users', 'routes', 'organisations', 'vehicles', 'ride_requests']) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'trg_' || tbl || '_updated_at'
        ) THEN
            EXECUTE format(
                'CREATE TRIGGER trg_%I_updated_at
                 BEFORE UPDATE ON %I
                 FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
                tbl, tbl
            );
        END IF;
    END LOOP;
END $$;
