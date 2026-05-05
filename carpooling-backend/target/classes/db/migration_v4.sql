-- =============================================================
-- Migration V4: Verification status + role_requests for driver KYC
-- Run ONCE against carpooling_db after migration_v3.sql
-- =============================================================

-- 1. New enum for verification lifecycle
CREATE TYPE verification_status AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- 2. Add verification columns to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS driver_status    verification_status NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS passenger_status verification_status NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS password_hash    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_read          BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Backfill existing users
UPDATE users SET passenger_status = 'APPROVED' WHERE role IN ('PASSENGER', 'BOTH');
UPDATE users SET driver_status    = 'APPROVED' WHERE role IN ('DRIVER',    'BOTH');

-- 4. role_requests table
CREATE TABLE role_requests (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_plate        VARCHAR(20)   NOT NULL,
    vehicle_model        VARCHAR(100)  NOT NULL,
    vehicle_type         VARCHAR(30)   NOT NULL,
    vehicle_fuel         VARCHAR(20)   NOT NULL,
    vehicle_seats        SMALLINT      NOT NULL,
    license_number       VARCHAR(50)   NOT NULL,
    license_expiry       DATE          NOT NULL,
    license_doc_url      VARCHAR(500)  NOT NULL,
    id_proof_type        VARCHAR(30)   NOT NULL,
    id_proof_number      VARCHAR(50)   NOT NULL,
    id_proof_doc_url     VARCHAR(500)  NOT NULL,
    rc_number            VARCHAR(50)   NOT NULL,
    rc_doc_url           VARCHAR(500)  NOT NULL,
    insurance_number     VARCHAR(50)   NOT NULL,
    insurance_expiry     DATE          NOT NULL,
    insurance_doc_url    VARCHAR(500)  NOT NULL,
    status               verification_status NOT NULL DEFAULT 'PENDING',
    admin_id             BIGINT        REFERENCES users(id),
    admin_note           TEXT,
    submitted_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    decided_at           TIMESTAMPTZ
);

CREATE INDEX idx_role_requests_user_id ON role_requests(user_id);
CREATE INDEX idx_role_requests_status  ON role_requests(status);

-- Only one PENDING request per (user, vehicle)
CREATE UNIQUE INDEX uniq_pending_vehicle
    ON role_requests(user_id, vehicle_plate)
    WHERE status = 'PENDING';
