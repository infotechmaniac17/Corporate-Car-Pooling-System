-- Add SUPER_ADMIN to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Add organisation_status enum type
DO $$ BEGIN
    CREATE TYPE organisation_status AS ENUM ('PENDING', 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add office address and status columns to organisations
ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS office_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS office_lat     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS office_lng     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS status         organisation_status NOT NULL DEFAULT 'PENDING';
