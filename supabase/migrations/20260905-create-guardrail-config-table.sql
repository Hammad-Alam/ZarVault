-- Create guardrail_config table
-- Stores platform-level pricing guardrail configuration.
--
-- For example, the platform can optionally define a maximum PKR price at which users are allowed to buy gold.
--
-- A NULL value means that no buy-price guardrail is currently configured.
CREATE TABLE
    IF NOT EXISTS guardrail_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- Optional maximum allowed buy price in PKR per gram.
        -- NULL means the guardrail is disabled.
        buy_price_guardrail_pkr DECIMAL(18, 2),
        -- Last time the configuration was changed.
        updated_at TIMESTAMP DEFAULT NOW ()
    );

-- Initial configuration
-- Start with no buy-price guardrail.
-- The platform can enable one later by updating this record.
INSERT INTO
    guardrail_config (buy_price_guardrail_pkr)
VALUES
    (NULL) ON CONFLICT DO NOTHING;