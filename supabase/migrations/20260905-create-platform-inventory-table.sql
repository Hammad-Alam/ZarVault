-- Create platform_inventory table
-- This table represents the inventory and PKR held by the platform itself.
--
-- The platform needs both PKR and gold so it can settle buy/sell transactions with users.
CREATE TABLE
    IF NOT EXISTS platform_inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- PKR currently available to the platform.
        pkr_balance DECIMAL(18, 2) NOT NULL DEFAULT 100000.00,
        -- Gold currently available in the platform's inventory.
        gold_grams DECIMAL(10, 4) NOT NULL DEFAULT 100.0000,
        -- Last time the platform inventory was updated.
        updated_at TIMESTAMP DEFAULT NOW (),
        -- Platform inventory should never become negative.
        CONSTRAINT positive_pkr CHECK (pkr_balance >= 0),
        CONSTRAINT positive_gold CHECK (gold_grams >= 0)
    );

-- Initial platform inventory
-- Seeds the platform with some starting PKR and gold so the trading flow can be tested immediately.
INSERT INTO
    platform_inventory (pkr_balance, gold_grams)
VALUES
    (100000.00, 100.0000) ON CONFLICT DO NOTHING;