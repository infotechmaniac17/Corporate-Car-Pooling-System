-- =============================================================
-- Migration V5: User commute addresses (home + secondary)
-- Adds nullable address columns to support saved commute locations.
-- Run ONCE against carpooling_db.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Add address columns to users table
-- ---------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS home_address      VARCHAR(500),
    ADD COLUMN IF NOT EXISTS home_lat          DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS home_lng          DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS secondary_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS secondary_lat     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS secondary_lng     DOUBLE PRECISION;

-- ---------------------------------------------------------------
-- 2. Index on home_lat/home_lng for future geo-matching queries
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_home_geo
    ON users (home_lat, home_lng)
    WHERE home_lat IS NOT NULL AND home_lng IS NOT NULL;
