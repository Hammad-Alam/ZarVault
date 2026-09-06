# What I Did — ZarVault

## Project Overview

ZarVault is a single-user 24K gold trading experience built for the Founding Engineer assessment. The product journey is:

```text
Market price -> Input -> Locked quote -> Confirmation -> Settlement -> Receipt and balances
```

The implementation uses Next.js App Router, TypeScript, Supabase PostgreSQL, Tailwind CSS, and the existing ZarVault logo asset. GitHub Copilot was used as an implementation accelerator; generated code was reviewed, run, debugged, and adjusted against actual runtime behavior.

## How I Understood the Assignment

I treated the brief as a small financial product rather than a generic CRUD interface. The important requirements were the financial invariants and product states:

- Display a trusted 24K PKR-per-gram market reference.
- Use PakGold first and GoldPrice.org as fallback.
- Cache trusted pricing for five minutes and expose source/freshness.
- Pause trading when neither provider produces a trusted price.
- Support BUY and SELL using PKR or gold input.
- Create a server-owned quote locked for 75 seconds.
- Reject expired quotes on the server.
- Use the stored execution price during settlement.
- Prevent duplicate confirmation from creating duplicate trades.
- Keep wallet and platform inventory balances consistent.
- Provide a clear receipt and understandable failure states.

The frontend was then shaped around trust: prices have visible source and freshness, quote states are explicit, and errors distinguish business conditions from infrastructure failures.

## Assumptions

- This is a single-user assessment demo, so the configured demo user is used instead of introducing authentication.
- The platform inventory contains one logical row.
- Supabase service-role access is available only on the server for financial operations.
- The browser countdown is presentation only; the stored server expiry is authoritative.
- PKR is stored to two decimal places and gold to four decimal places.
- A `NULL` guardrail means the optional BUY guardrail is disabled.
- The database `guardrail_config` row is the active guardrail source of truth. `BUY_PRICE_GUARDRAIL_PKR=null` is retained in the environment template for compatibility with the original assessment instructions.

## What I Built

### Database and data model

The Supabase migrations create:

- `wallets` for customer PKR and gold balances.
- `platform_inventory` for platform liquidity.
- `price_cache` for five-minute trusted-price caching.
- `guardrail_config` for optional BUY-price configuration.
- `quotes` for locked price, amounts, expiry, and lifecycle status.
- `trades` for completed settlements.

Financial columns use PostgreSQL decimal types. Balance constraints prevent negative values, indexes support common lookups, and `trades.quote_id` is unique so one quote cannot create two trade records.

### Pricing

The pricing service first checks a valid cache entry. If no trusted cache is available, it tries PakGold and then the fallback provider. Provider responses are normalized, positive values are required, and external requests have timeouts. When both providers fail, the application returns a non-tradable state instead of inventing a price.

BUY pricing uses:

```text
max(market price * 1.10, configured BUY guardrail)
```

SELL pricing uses:

```text
market price * 0.90
```

### Quote and settlement APIs

The quote route validates side, input type, amount, trusted price, balances, and inventory before storing a 75-second quote.

The confirmation route retrieves the stored quote, checks its status and expiry, re-checks balances and inventory, applies the settlement updates, creates a trade, and marks the quote settled. It returns the completed trade information used by the receipt.

Additional read-only routes restore the latest active or expired quote after refresh and load recent trade history for the activity view.

### Frontend experience

The interface was redesigned as a calm financial product rather than a trading terminal. It includes:

- ZarVault branding and `Pure Gold, Instant Trust` tagline.
- Market overview with price, source, freshness, and truthful unavailable state.
- Portfolio balance summary.
- BUY/SELL trade form with PKR/gold input.
- Custom input-type dropdown.
- Locked quote review with server-derived countdown.
- Explicit expired quote state with no-funds-charged messaging.
- Quote recovery after browser refresh.
- Custom success, warning, and error toasts.
- Settlement receipt with reference and updated balances.
- Recent activity with five-item pagination.
- Responsive mobile-first layout and accessible focus states.

## Key Decisions

### Server-owned quotes

The quote stores the execution price and expiry. Confirmation never recalculates pricing from the latest market value. This preserves the promise made to the customer even if the market changes during the lock period.

### Truthful error semantics

A failed database lookup must not become an insufficient-balance message. A missing trusted price must not become a fabricated fallback price. The user should understand whether the issue is their balance, market availability, quote validity, or system infrastructure.

### Database guardrail

The initial guardrail migration inserts `NULL`, so the normal formula remains active. To enable it, update `guardrail_config.buy_price_guardrail_pkr` in Supabase, for example:

```sql
UPDATE guardrail_config
SET buy_price_guardrail_pkr = 37000,
    updated_at = NOW();
```

To disable it, set the value back to `NULL`.

### Small scope

Authentication, payment processing, admin dashboards, analytics, and microservices were intentionally excluded because they were outside the assessment scope. The focus stayed on a coherent and trustworthy trading journey.

### Clean runtime output

Temporary request payload dumps, quote insert dumps, and parameter-debug logs were removed from the API client, quote route, and trade service. Meaningful provider and endpoint failure logs remain for operational diagnosis.

## Testing and Verification

The important scenarios considered were:

- BUY with PKR input.
- SELL with gold input.
- Locked quote review and 75-second expiry.
- Confirmation after expiry.
- Refresh during an active quote.
- Refresh after a quote expires.
- Duplicate confirmation.
- Insufficient PKR.
- Insufficient gold.
- Insufficient platform inventory.
- Pricing unavailable.
- Updated balances and receipt output.
- Responsive mobile and desktop presentation.

Editor diagnostics were used during the final UI and documentation changes. A production-grade automated integration suite remains a follow-up item.

## Known Gaps

### Settlement atomicity

Wallet, inventory, trade, and quote updates are currently separate Supabase operations. A production implementation should move the complete flow into one PostgreSQL transaction or RPC function with row locks and rollback semantics. This is the most important remaining hardening item.

### Provider adapters

External providers can change markup or response formats. Provider adapters should be covered by integration tests and monitored with structured source-specific metrics.

### Authentication

The assessment uses a fixed demo user. A real product would require authenticated users, authorization checks, and tenant/user isolation on every financial query.

### Automated integration coverage

The next testing investment should cover concurrent confirmation, rollback after partial failure, expiry boundaries, provider failures, and balance/inventory invariants.

## AI-Assisted Development Process

The working loop was:

```text
decide -> prompt -> inspect -> run -> debug -> review -> test -> iterate
```

Copilot helped with scaffolding, SQL drafts, API route implementation, pricing-service structure, React components, UI refinement, and documentation. I retained ownership of architecture, schema decisions, pricing rules, precision, validation order, settlement semantics, provider verification, runtime debugging, and the known-gap assessment.

The important lesson was not to treat generated code as proof of correctness. Real provider behavior, Supabase permissions, timestamp handling, misleading error paths, and settlement atomicity all required engineering review beyond the initial generated implementation.

## Final Status

ZarVault is a functional assessment demo with a polished trading flow, explicit financial states, documented setup, and known limitations recorded honestly. The next production priority is atomic settlement, followed by automated integration tests and stronger observability.
