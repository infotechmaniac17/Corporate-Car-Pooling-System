-- =============================================================================
-- Migration V2 — Add columns required by Spring Boot backend
-- Run AFTER schema.sql (initial schema must already exist)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- users: password_hash
-- ---------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';

-- Remove the DEFAULT after backfill so future inserts must supply a value
ALTER TABLE users
    ALTER COLUMN password_hash DROP DEFAULT;


-- ---------------------------------------------------------------------------
-- chat_messages: is_read
-- ---------------------------------------------------------------------------
ALTER TABLE chat_messages
    ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;


-- ---------------------------------------------------------------------------
-- transactions: razorpay_order_id, razorpay_payment_id
-- ---------------------------------------------------------------------------
ALTER TABLE transactions
    ADD COLUMN razorpay_order_id   VARCHAR(100),
    ADD COLUMN razorpay_payment_id VARCHAR(100);

CREATE INDEX idx_transactions_razorpay_order_id ON transactions(razorpay_order_id)
    WHERE razorpay_order_id IS NOT NULL;
