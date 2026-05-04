-- =============================================================================
-- Corporate Carpooling System — PostgreSQL 16 + PostGIS Schema
-- Generated: 2026-05-02
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;


-- ---------------------------------------------------------------------------
-- ENUM Types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role       AS ENUM ('DRIVER', 'PASSENGER', 'BOTH');
CREATE TYPE schedule_status AS ENUM ('CREATED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE request_status  AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE txn_status      AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED');


-- ---------------------------------------------------------------------------
-- organisations
-- ---------------------------------------------------------------------------


CREATE TABLE organisations (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    domain     VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE organisations IS 'Corporate organisations that own users';
-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------


CREATE TABLE users (
    id              BIGSERIAL      PRIMARY KEY,
    organisation_id BIGINT         NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
    name            VARCHAR(255)   NOT NULL,
    email           VARCHAR(255)   NOT NULL UNIQUE,
    phone           VARCHAR(20)    NOT NULL,
    gender          VARCHAR(20),
    role            user_role      NOT NULL,
    rating          DECIMAL(3, 2)  CHECK (rating >= 0 AND rating <= 5),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'All system users — drivers, passengers, or both';
CREATE INDEX idx_users_organisation_id ON users(organisation_id);
CREATE INDEX idx_users_email           ON users(email);
CREATE INDEX idx_users_role            ON users(role);


-- ---------------------------------------------------------------------------
-- guardian_contacts
-- ---------------------------------------------------------------------------

CREATE TABLE guardian_contacts (
    id       BIGSERIAL    PRIMARY KEY,
    user_id  BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name     VARCHAR(255) NOT NULL,
    phone    VARCHAR(20)  NOT NULL,
    relation VARCHAR(100) NOT NULL
);
COMMENT ON TABLE guardian_contacts IS 'Emergency contacts attached to a user for SOS scenarios';

CREATE INDEX idx_guardian_contacts_user_id ON guardian_contacts(user_id);


-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------

CREATE TABLE vehicles (
    id             BIGSERIAL    PRIMARY KEY,
    driver_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50)  NOT NULL UNIQUE,
    capacity       SMALLINT     NOT NULL CHECK (capacity > 0),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE vehicles IS 'Vehicles registered by drivers';

CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);


-- ---------------------------------------------------------------------------
-- routes  (PostGIS LineString)
-- ---------------------------------------------------------------------------

CREATE TABLE routes (
    id          BIGSERIAL                    PRIMARY KEY,
    user_id     BIGINT                       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    path        GEOMETRY(LineString, 4326)   NOT NULL,
    distance_km DECIMAL(10, 3)               NOT NULL CHECK (distance_km > 0),
    created_at  TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ                  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE routes IS 'Spatial route paths defined by drivers or passengers';

CREATE INDEX idx_routes_user_id ON routes(user_id);
CREATE INDEX idx_routes_path    ON routes USING GIST(path);


-- ---------------------------------------------------------------------------
-- ride_schedules
-- ---------------------------------------------------------------------------

CREATE TABLE ride_schedules (
    id                   BIGSERIAL       PRIMARY KEY,
    driver_id            BIGINT          NOT NULL REFERENCES users(id)     ON DELETE RESTRICT,
    vehicle_id           BIGINT          NOT NULL REFERENCES vehicles(id)  ON DELETE RESTRICT,
    route_id             BIGINT          NOT NULL REFERENCES routes(id)    ON DELETE RESTRICT,
    departure_time       TIMESTAMPTZ     NOT NULL,
    available_seats      SMALLINT        NOT NULL CHECK (available_seats >= 0),
    detour_limit_percent DECIMAL(5, 2)   NOT NULL DEFAULT 20.00 CHECK (detour_limit_percent >= 0),
    status               schedule_status NOT NULL DEFAULT 'CREATED',
    created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ride_schedules IS 'Driver-created ride offers with schedule and capacity';

CREATE INDEX idx_ride_schedules_driver_id    ON ride_schedules(driver_id);
CREATE INDEX idx_ride_schedules_vehicle_id   ON ride_schedules(vehicle_id);
CREATE INDEX idx_ride_schedules_route_id     ON ride_schedules(route_id);
CREATE INDEX idx_ride_schedules_status       ON ride_schedules(status);
CREATE INDEX idx_ride_schedules_departure    ON ride_schedules(departure_time);


-- ---------------------------------------------------------------------------
-- ride_requests
-- ---------------------------------------------------------------------------

CREATE TABLE ride_requests (
    id              BIGSERIAL              PRIMARY KEY,
    ride_id         BIGINT                 NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    passenger_id    BIGINT                 NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    pickup_location GEOGRAPHY(Point, 4326) NOT NULL,
    drop_location   GEOGRAPHY(Point, 4326) NOT NULL,
    status          request_status         NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ride_requests IS 'Passenger requests to join a specific ride schedule';

CREATE INDEX idx_ride_requests_ride_id         ON ride_requests(ride_id);
CREATE INDEX idx_ride_requests_passenger_id    ON ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status          ON ride_requests(status);
CREATE INDEX idx_ride_requests_pickup_location ON ride_requests USING GIST(pickup_location);
CREATE INDEX idx_ride_requests_drop_location   ON ride_requests USING GIST(drop_location);


-- ---------------------------------------------------------------------------
-- backup_rides
-- ---------------------------------------------------------------------------

CREATE TABLE backup_rides (
    id               BIGSERIAL PRIMARY KEY,
    ride_id          BIGINT    NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    backup_driver_id BIGINT    NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    priority         SMALLINT  NOT NULL DEFAULT 1 CHECK (priority > 0),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ride_id, backup_driver_id)
);
COMMENT ON TABLE backup_rides IS 'Backup drivers assigned to a ride schedule with priority order';


CREATE INDEX idx_backup_rides_ride_id          ON backup_rides(ride_id);
CREATE INDEX idx_backup_rides_backup_driver_id ON backup_rides(backup_driver_id);


-- ---------------------------------------------------------------------------
-- ride_location_pings
-- ---------------------------------------------------------------------------

CREATE TABLE ride_location_pings (
    id          BIGSERIAL              PRIMARY KEY,
    ride_id     BIGINT                 NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    location    GEOGRAPHY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE ride_location_pings IS 'Real-time GPS pings recorded during an active ride';

CREATE INDEX idx_ride_location_pings_ride_id     ON ride_location_pings(ride_id);
CREATE INDEX idx_ride_location_pings_recorded_at ON ride_location_pings(recorded_at);
CREATE INDEX idx_ride_location_pings_location    ON ride_location_pings USING GIST(location);


-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------

CREATE TABLE chat_messages (
    id         BIGSERIAL    PRIMARY KEY,
    ride_id    BIGINT       NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    sender_id  BIGINT       NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    message    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE chat_messages IS 'In-ride chat messages between driver and passengers';

CREATE INDEX idx_chat_messages_ride_id   ON chat_messages(ride_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);


-- ---------------------------------------------------------------------------
-- sos_incidents
-- ---------------------------------------------------------------------------

CREATE TABLE sos_incidents (
    id           BIGSERIAL              PRIMARY KEY,
    ride_id      BIGINT                 NOT NULL REFERENCES ride_schedules(id) ON DELETE CASCADE,
    triggered_by BIGINT                 NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
    location     GEOGRAPHY(Point, 4326) NOT NULL,
    created_at   TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sos_incidents IS 'SOS alerts triggered by users during a ride';

CREATE INDEX idx_sos_incidents_ride_id      ON sos_incidents(ride_id);
CREATE INDEX idx_sos_incidents_triggered_by ON sos_incidents(triggered_by);


-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------

CREATE TABLE transactions (
    id             BIGSERIAL    PRIMARY KEY,
    ride_id        BIGINT       NOT NULL REFERENCES ride_schedules(id) ON DELETE RESTRICT,
    amount         DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status         txn_status   NOT NULL DEFAULT 'INITIATED',
    payment_method VARCHAR(50)  NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE transactions IS 'Payment records for each ride';

CREATE INDEX idx_transactions_ride_id ON transactions(ride_id);
CREATE INDEX idx_transactions_status  ON transactions(status);


-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------

CREATE TABLE ratings (
    id         BIGSERIAL    PRIMARY KEY,
    given_by   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    given_to   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score      SMALLINT     NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT no_self_rating CHECK (given_by <> given_to)
);
COMMENT ON TABLE ratings IS 'Mutual ratings between drivers and passengers after a ride';

CREATE INDEX idx_ratings_given_by ON ratings(given_by);
CREATE INDEX idx_ratings_given_to ON ratings(given_to);


-- =============================================================================
-- UTILITY FUNCTION: auto-update updated_at on row change
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Attach to every table that has updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'organisations','users','vehicles','routes',
        'ride_schedules','ride_requests'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_updated_at
             BEFORE UPDATE ON %1$s
             FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;

