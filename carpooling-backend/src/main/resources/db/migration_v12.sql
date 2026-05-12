-- Phase 2.1: Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT      NOT NULL REFERENCES users(id),
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    type         VARCHAR(50)  NOT NULL,
    ride_id      BIGINT REFERENCES ride_schedules(id) ON DELETE SET NULL,
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- Phase 2.2: Backup driver status lifecycle
ALTER TABLE backup_rides
    ADD COLUMN IF NOT EXISTS status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
