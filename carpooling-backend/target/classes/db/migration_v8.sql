-- Add SUSPENDED status to organisation_status enum
ALTER TYPE organisation_status ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- Organisation offices (multiple locations per org)
CREATE TABLE IF NOT EXISTS organisation_offices (
    id              BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    address         VARCHAR(500),
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link users to a specific office (nullable — existing users unaffected)
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_id BIGINT REFERENCES organisation_offices(id) ON DELETE SET NULL;

-- Suspension flag for individual users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;
