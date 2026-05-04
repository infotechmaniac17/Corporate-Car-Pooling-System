-- ===========================================================================
-- Email OTP verification table
-- Stores hashed one-time codes for the registration email-verification flow.
-- ===========================================================================

CREATE TABLE email_verifications (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    otp_hash    VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    consumed    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_email      ON email_verifications(email);
CREATE INDEX idx_email_verifications_created_at ON email_verifications(created_at DESC);

COMMENT ON TABLE email_verifications IS 'Email OTP records issued during signup; verified rows are consumed by /auth/register.';
