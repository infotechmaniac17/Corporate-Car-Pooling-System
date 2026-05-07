ALTER TABLE ride_schedules
    ALTER COLUMN route_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS pickup_location  geography(Point,4326),
    ADD COLUMN IF NOT EXISTS pickup_label     VARCHAR(500),
    ADD COLUMN IF NOT EXISTS dropoff_location geography(Point,4326),
    ADD COLUMN IF NOT EXISTS dropoff_label    VARCHAR(500),
    ADD COLUMN IF NOT EXISTS fare             NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_ride_schedules_pickup_geo
    ON ride_schedules USING GIST (pickup_location);
CREATE INDEX IF NOT EXISTS idx_ride_schedules_dropoff_geo
    ON ride_schedules USING GIST (dropoff_location);
