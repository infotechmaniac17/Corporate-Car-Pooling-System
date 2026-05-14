-- Migration v9: Publish-then-discover model (Phase 1)
-- Adds booked_seats + recurring_days to ride_schedules
-- Creates trip_bookings table for seat-level booking

ALTER TABLE ride_schedules ADD COLUMN IF NOT EXISTS booked_seats INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ride_schedules ADD COLUMN IF NOT EXISTS recurring_days VARCHAR(50);

CREATE TABLE IF NOT EXISTS trip_bookings (
    id                BIGSERIAL PRIMARY KEY,
    ride_schedule_id  BIGINT NOT NULL REFERENCES ride_schedules(id),
    passenger_id      BIGINT NOT NULL REFERENCES users(id),
    pickup_lat        DOUBLE PRECISION,
    pickup_lng        DOUBLE PRECISION,
    pickup_label      VARCHAR(500),
    dropoff_lat       DOUBLE PRECISION,
    dropoff_lng       DOUBLE PRECISION,
    dropoff_label     VARCHAR(500),
    status            VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_trip_booking_active UNIQUE (ride_schedule_id, passenger_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_schedule   ON trip_bookings(ride_schedule_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_passenger  ON trip_bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_status     ON trip_bookings(status);
