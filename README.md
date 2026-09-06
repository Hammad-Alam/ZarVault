**ZarVault**

**Pure Gold, Instant Trust**

ZarVault is a single-user 24K gold trading assessment application built with Next.js, TypeScript, Supabase PostgreSQL, and Tailwind CSS. It supports trusted market pricing, PKR or gold input, server-owned 75-second quotes, confirmation, balances, receipts, and recent activity.

## Features

- PakGold primary pricing with GoldPrice.org fallback.
- Five-minute server-side price cache with freshness and source visibility.
- BUY price at `market * 1.10` and SELL price at `market * 0.90`.
- Optional database-backed BUY price guardrail.
- PKR and gold input with precise stored values.
- 75-second locked quotes enforced by the server.
- Quote recovery after refresh and explicit expired-quote state.
- Duplicate confirmation protection through quote/trade lifecycle rules.
- Updated wallet and platform inventory balances after settlement.
- Receipt view, custom toasts, responsive layout, and paginated activity.

## Requirements

- Node.js 20 or newer
- A Supabase project
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   NEXT_PUBLIC_DEMO_USER_ID=00000000-0000-0000-0000-000000000001
   BUY_PRICE_GUARDRAIL_PKR=null
   ```

   Never commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

3. Run every SQL migration in `supabase/migrations/` in filename order using the Supabase SQL editor or Supabase CLI. This creates the wallet, platform inventory, pricing cache, guardrail, quote, and trade tables.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000.

## Guardrail Configuration

The current implementation reads the guardrail from the single row in Supabase `guardrail_config`. The initial migration inserts `NULL`, which disables the optional guardrail and leaves BUY pricing at `market * 1.10`.

To configure it, run:

```sql
UPDATE guardrail_config
SET buy_price_guardrail_pkr = 37000,
	 updated_at = NOW();
```

The effective BUY price is `max(market * 1.10, buy_price_guardrail_pkr)`. To disable it again:

```sql
UPDATE guardrail_config
SET buy_price_guardrail_pkr = NULL,
	 updated_at = NOW();
```

`BUY_PRICE_GUARDRAIL_PKR=null` remains in the environment template for compatibility with the original assessment setup, but the database row is the active source of truth in this implementation.

## Useful Commands

```bash
npm run dev       # Start local development
npm run build     # Create a production build
npm run start     # Start the production server after building
```

## Project Structure

- `app/api/` - market, balance, quote, confirmation, recovery, and history routes.
- `app/components/` - market, portfolio, trade, quote, receipt, activity, and toast UI.
- `app/hooks/useTrading.ts` - client-side orchestration of the existing trading APIs.
- `app/lib/services/` - pricing and trade business logic.
- `app/lib/api.ts` - browser API client.
- `app/config/constants.ts` - shared pricing and demo configuration.
- `supabase/migrations/` - database schema and data constraints.
- `public/Logo.jpg` - ZarVault brand asset.

## Important Financial Rules

- No trusted market price means trading is paused.
- The server stores and enforces quote expiry; the browser countdown is presentation only.
- Confirmation uses the stored quote execution price and never recalculates from the latest market price.
- The quote-to-trade relationship is unique to prevent duplicate trade records.
- Monetary values are stored with two decimal places and gold quantities with four decimal places.

## Known Gaps

The settlement flow currently performs wallet, inventory, trade, and quote updates as separate Supabase operations. A production version should move the complete settlement into one PostgreSQL transaction or RPC function with row locking and rollback semantics. See [WhatIDid.md](WhatIDid.md) for the full implementation record, assumptions, and testing notes.
