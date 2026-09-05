-- Create wallets table
-- Each user has one wallet that keeps track of their available PKR balance and the amount of gold they currently own.
--
-- The user_id is unique because a user should only have one wallet in the system.
CREATE TABLE
    IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- Links the wallet to the application user.
        user_id UUID NOT NULL UNIQUE,
        -- Available PKR balance in the user's wallet.
        pkr_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
        -- Gold owned by the user, stored in grams.
        gold_grams DECIMAL(10, 4) NOT NULL DEFAULT 10.0000,
        -- Last time the wallet balance was updated.
        updated_at TIMESTAMP DEFAULT NOW (),
        -- Balances must never become negative.
        CONSTRAINT positive_pkr CHECK (pkr_balance >= 0),
        CONSTRAINT positive_gold CHECK (gold_grams >= 0)
    );

-- Speeds up lookups when retrieving a wallet by user.
CREATE INDEX idx_wallets_user_id ON wallets (user_id);

-- Demo data
-- Creates an initial wallet for the demo user.
-- ON CONFLICT prevents the insert from failing if this wallet already exists.
INSERT INTO
    wallets (user_id, pkr_balance, gold_grams)
VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        100000.00,
        10.0000
    ) ON CONFLICT DO NOTHING;