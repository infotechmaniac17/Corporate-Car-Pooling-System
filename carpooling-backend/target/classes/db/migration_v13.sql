-- Migration V13: Trip bookings (publish-then-discover model)
-- Adds booked_seats + recurring_days to ride_schedules,
-- and creates trip_bookings table.

-- ── ride_schedules additions ──────────────────────────────────────────────────

ALTER TABLE ride_schedules
    ADD COLUMN IF NOT EXISTS booked_seats   INT          NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS recurring_days VARCHAR(50);

ALTER TABLE ride_schedules
    ADD CONSTRAINT chk_booked_seats_non_negative CHECK (booked_seats >= 0);

-- ── trip_bookings table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_bookings (
    id               BIGSERIAL PRIMARY KEY,
    ride_schedule_id BIGINT       NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    passenger_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pickup_lat       DOUBLE PRECISION,
    pickup_lng       DOUBLE PRECISION,
    pickup_label     VARCHAR(500),
    dropoff_lat      DOUBLE PRECISION,
    dropoff_lng      DOUBLE PRECISION,
    dropoff_label    VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_schedule   ON trip_bookings(ride_schedule_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_passenger  ON trip_bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_status     ON trip_bookings(ride_schedule_id, status);
