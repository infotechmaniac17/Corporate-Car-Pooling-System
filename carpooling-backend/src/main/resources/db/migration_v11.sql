-- Phase 1.3: SOS incident status/resolution tracking
ALTER TABLE sos_incidents
    ADD COLUMN IF NOT EXISTS status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS resolved_at  TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolved_by  BIGINT REFERENCES users(id);

-- Add email to guardian contacts for SOS email notifications
ALTER TABLE guardian_contacts
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);
