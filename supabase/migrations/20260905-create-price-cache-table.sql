-- Create price_cache table
-- Stores recently fetched gold prices so the application does not need to call the external pricing source unnecessarily often.
--
-- Each record contains the price, its source, and the period during which the cached price should be considered valid.
CREATE TABLE
    IF NOT EXISTS price_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        -- Gold market price in PKR per gram.
        price_pkr_per_gram DECIMAL(18, 2) NOT NULL,
        -- Name / identifier of the external price source.
        source VARCHAR(50) NOT NULL,
        -- Time when this price was fetched.
        fetched_at TIMESTAMP NOT NULL,
        -- Time after which this cached price should no longer be used.
        expires_at TIMESTAMP NOT NULL,
        -- A cached price must always be greater than zero.
        CONSTRAINT positive_price CHECK (price_pkr_per_gram > 0)
    );

-- Helps quickly find cached prices that have expired.
CREATE INDEX idx_price_cache_expires_at ON price_cache (expires_at);