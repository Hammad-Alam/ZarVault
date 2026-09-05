-- Create quotes table
-- A quote represents the price offered to a user before a trade is confirmed.
--
-- Quotes are intentionally stored so we can:
--   1. Keep the exact price shown to the user.
--   2. Enforce quote expiration.
--   3. Track which market price was used.
--   4. Link a completed trade back to its original quote.
CREATE TABLE
    IF NOT EXISTS quotes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- User who requested the quote.
        user_id UUID NOT NULL,
        -- BUY means the user is buying gold.
        -- SELL means the user is selling gold.
        side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
        -- Determines whether the user entered an amount in PKR or directly in grams of gold.
        input_type VARCHAR(4) NOT NULL CHECK (input_type IN ('PKR', 'GOLD')),
        -- Original amount entered by the user.
        input_amount DECIMAL(18, 4) NOT NULL,
        -- Gold amount represented by this quote.
        gold_grams DECIMAL(10, 4) NOT NULL,
        -- Total PKR value of the quoted transaction.
        total_pkr DECIMAL(18, 2) NOT NULL,
        -- Market price fetched from the configured price source.
        market_price DECIMAL(18, 2) NOT NULL,
        -- Final price used for this specific quote after applying any execution pricing or guardrails.
        execution_price DECIMAL(18, 2) NOT NULL,
        -- Identifies where the market price came from.
        price_source VARCHAR(50) NOT NULL,
        -- Time at which the market price was retrieved.
        price_fetched_at TIMESTAMP NOT NULL,
        -- When this quote was created.
        created_at TIMESTAMP DEFAULT NOW (),
        -- Quote becomes invalid after this time.
        expires_at TIMESTAMP NOT NULL,
        -- Current lifecycle state of the quote.
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'SETTLED')),
        -- Filled after the quote is successfully converted into a completed trade.
        settled_trade_id UUID,
        -- All monetary/quantity values must be positive.
        CONSTRAINT positive_amounts CHECK (
            input_amount > 0
            AND gold_grams > 0
            AND total_pkr > 0
            AND execution_price > 0
        )
    );

-- Indexes
-- These indexes support the most common quote lookups:
-- user's quotes, quote status, and expired quotes.
CREATE INDEX idx_quotes_user_id ON quotes (user_id);

CREATE INDEX idx_quotes_status ON quotes (status);

CREATE INDEX idx_quotes_expires_at ON quotes (expires_at);