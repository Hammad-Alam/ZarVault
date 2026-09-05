-- Create trades table
-- A trade represents a successfully confirmed transaction.
--
-- Unlike a quote, which is temporary and can expire, a trade represents an actual completed transaction and becomes part of the user's transaction history.
CREATE TABLE
    IF NOT EXISTS trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- User who completed the trade.
        user_id UUID NOT NULL,
        -- Every trade must originate from one quote.
        -- UNIQUE ensures that a quote cannot be settled twice.
        quote_id UUID NOT NULL UNIQUE REFERENCES quotes (id),
        -- Whether the user bought or sold gold.
        side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
        -- Amount of gold involved in the completed trade.
        gold_grams DECIMAL(10, 4) NOT NULL,
        -- Final execution price per gram.
        price_per_gram DECIMAL(18, 2) NOT NULL,
        -- Total PKR value of the completed transaction.
        total_pkr DECIMAL(18, 2) NOT NULL,
        -- When the trade was completed.
        created_at TIMESTAMP DEFAULT NOW (),
        -- Trade quantities and monetary values must be positive.
        CONSTRAINT positive_amounts CHECK (
            gold_grams > 0
            AND price_per_gram > 0
            AND total_pkr > 0
        )
    );

-- Indexes
-- User and quote lookups are common when displaying trade history or checking whether a quote has already been settled.
CREATE INDEX idx_trades_user_id ON trades (user_id);

CREATE INDEX idx_trades_quote_id ON trades (quote_id);