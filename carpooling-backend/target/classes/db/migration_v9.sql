-- Phase 1.2: Ride lifecycle audit log
CREATE TABLE IF NOT EXISTS ride_events (
    id               BIGSERIAL PRIMARY KEY,
    ride_schedule_id BIGINT NOT NULL REFERENCES ride_schedules(id),
    event_type       VARCHAR(50) NOT NULL,
    actor_id         BIGINT REFERENCES users(id),
    metadata         TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ride_events_schedule ON ride_events(ride_schedule_id);
