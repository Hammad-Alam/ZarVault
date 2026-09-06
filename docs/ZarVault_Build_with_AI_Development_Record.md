# ZarVault — Build with AI Development Record

> **Project:** ZarVault — *Pure Gold, Instant Trust*  
> **Build date:** September 5-6, 2026  
> **Stack:** Next.js, TypeScript, Supabase PostgreSQL, Tailwind CSS, Vercel  
> **AI coding assistant:** GitHub Copilot
>
> **Note:** This is a reconstructed chronological development record based on the actual development process. It is not presented as a verbatim export of Copilot's internal chat history. It deliberately records both useful AI-assisted work and the debugging/dead ends encountered during development.

---

## 1. How I Approached the Assessment

I treated the assessment as a small financial product rather than a generic CRUD application.

The brief looked small, but the important details were the financial and product-state requirements: live 24K pricing, a five-minute server-side cache, a 75-second locked quote, safe confirmation, consistent balances, and clear handling of failures.

My approach was therefore:

1. Understand the assessment and identify the critical invariants.
2. Design the database/schema myself.
3. Initialize the Next.js application and basic structure.
4. Use Copilot for focused implementation rather than asking it to build the entire product.
5. Review generated code and test it against actual behavior.
6. Debug real database, provider, and frontend issues.
7. Build the basic UI and then use AI to improve the presentation and UX.
8. Test the important trading paths.
9. Document known gaps honestly.

---

# 2. Project Initialization

I chose a single Next.js full-stack application.

The main alternatives were a separate React frontend + Node backend, microservices, or a more elaborate architecture.

I rejected those because the assessment had an expected effort of around three hours and did not require them.

### Prompt used with Copilot

> "Set up the foundation for a Next.js application using TypeScript and Tailwind CSS. This will be a single-user gold trading demo backed by Supabase PostgreSQL. Keep the structure simple and suitable for a small assessment. Do not introduce unnecessary state-management libraries or authentication."

Copilot helped with the initial project scaffolding and configuration. I then reviewed the generated structure and continued with the application-specific design.

---

# 3. Database Schema

The database was one of the areas I wanted to reason about before generating implementation code.

The main tables were:

- `wallets`
- `platform_inventory`
- `quotes`
- `trades`
- `price_cache`
- `guardrail_config`

I used PostgreSQL numeric/decimal fields for financial values rather than relying on floating-point storage.

The customer wallet uses two-decimal PKR precision and four-decimal gold precision. Negative balances are protected with database constraints.

The quote stores the locked execution price and expiry information. Trades are linked to quotes and the quote relationship is unique to prevent duplicate settlement records.

### Review prompt

> "Review this PostgreSQL schema for a single-user gold trading application. Check decimal precision, negative-balance constraints, quote lifecycle, duplicate settlement protection, relationships, and indexes. Point out anything that could cause inconsistent balances."

The AI review helped identify missing indexes and some areas worth tightening. I made those changes before continuing.

---

# 4. Seed Data

The assessment needs a reviewer to immediately understand the starting state.

I seeded:

- Customer: **₨100,000 PKR + 10.0000g gold**
- Platform inventory: **₨100,000 PKR + 100.0000g gold**

### Prompt

> "Generate PostgreSQL seed statements for the demo wallet and platform inventory using these exact starting balances: customer 100000 PKR and 10 grams gold; platform 100000 PKR and 100 grams gold."

I checked the generated SQL against the schema and demo-user configuration before executing it.

---

# 5. Pricing Service — First Implementation

Pricing was an important part of the assessment because trading must stop if trusted pricing is unavailable.

I first used Copilot to scaffold the pricing service.

### Prompt

> "Implement a server-side pricing service for ZarVault. Use PakGold as the primary source and GoldPrice.org as the fallback. Cache the normalized market price for five minutes. Return the price, source, fetch time, freshness, and whether the price is trusted. If both sources fail, trading must be unavailable."

The first implementation captured the basic try-primary/fallback pattern, but I reviewed it rather than treating it as complete.

I specifically checked:

- invalid price values;
- zero/negative prices;
- cache expiry;
- freshness;
- source information;
- both providers failing;
- external requests hanging.

### Follow-up prompt

> "Harden this pricing service. Validate that the normalized price is positive, track fetchedAt and freshness, only use a valid cache entry, add a timeout to external requests, and return a non-tradable state if both pricing sources fail."

I added a five-second timeout and source-specific logging.

The important product rule became:

**No trusted price = no trading.**

---

# 6. Real Provider Investigation

This was one of the places where the actual development differed from the simple initial implementation.

The first pricing path encountered a DNS error involving:

`api.gold-api.com`

The error was:

`ENOTFOUND api.gold-api.com`

That made it clear that I could not simply assume an endpoint existed because generated code contained one.

I investigated the real pricing source behavior instead.

## PakGold

I found that the live price was available in the webpage itself rather than through the JSON endpoint initially assumed by the implementation.

That meant the source adapter needed to fetch and parse the actual page server-side rather than blindly calling `.json()`.

## GoldPrice.org

I also found that:

`goldprice.org/gold-price-pakistan.html`

is an HTML page rather than a JSON API.

The initial fallback implementation assumed JSON, so this required source-specific handling.

### Takeaway

This was a useful example of why AI-generated integration code still needs to be checked against the real provider.

A fetch implementation can be syntactically correct while the assumed API contract is wrong.

---

# 7. Quote Creation

Once the pricing layer was in place, I used Copilot for the first implementation of quote creation.

### Prompt

> "Implement POST /api/quotes/create for ZarVault.
>
> Requirements:
> - validate BUY/SELL;
> - validate PKR/GOLD input;
> - validate the input amount;
> - get the trusted market price server-side;
> - BUY price = max(market * 1.10, configured guardrail);
> - SELL price = market * 0.90;
> - calculate the corresponding PKR/gold amount;
> - validate customer balance;
> - validate platform inventory;
> - create a quote expiring in 75 seconds;
> - return the locked execution price and expiry information."

Copilot produced the basic route, and I then tested and reviewed it.

---

# 8. Actual Runtime Debugging

A significant part of the build was normal debugging rather than simply accepting generated code.

## 8.1 Wallet Permission Error

The wallet query returned:

`42501 — permission denied`

The initial error handling also risked interpreting a failed wallet query as an insufficient-balance condition.

### Fix

For server-side financial operations, I used the server-side Supabase admin/service-role client and reviewed the required database permissions.

---

## 8.2 Misleading `INSUFFICIENT_PKR`

I found logic where a missing wallet result could become:

`INSUFFICIENT_PKR`

That hid the real database problem.

### Prompt

> "The wallet query is failing, but the API is returning INSUFFICIENT_PKR. Help me distinguish a Supabase query error from a wallet that was successfully found but does not have enough PKR."

The fix was to explicitly check the database error first.

Conceptually:

```ts
if (walletError) {
  return { error: "WALLET_LOOKUP_FAILED" };
}

if (!wallet) {
  return { error: "WALLET_NOT_FOUND" };
}
```

Only after a successful lookup should insufficient balance be evaluated.

This was an important distinction: **infrastructure failures should not be disguised as business errors.**

---

## 8.3 `side is not defined`

While adding debug logging, I accidentally placed a `console.log` outside the function where `side`, `inputType`, and `inputAmount` existed.

The resulting error was:

`side is not defined`

### Fix

I moved the logging into the relevant function scope.

Small issue, but a good reminder to inspect the actual generated/debug code rather than only the intended logic.

---

## 8.4 Quotes Table Permission Error

Quote creation then produced:

`permission denied for table quotes`

The server-side role did not have the required privileges for the table.

### Fix

I granted the required privileges to the server-side service role and re-ran the quote flow.

---

# 9. Quote Precision

The initial quote calculation used ordinary JavaScript arithmetic:

```ts
goldGrams = inputAmount / executionPrice;
```

The formula itself was correct, but the resulting floating-point representation needed explicit normalization.

### Review prompt

> "Review the quote calculations for financial precision. PKR should use two decimal places and gold grams four decimal places. Make sure displayed and persisted values remain consistent."

I added explicit rounding/normalization rules.

The intended precision is:

- PKR: 2 decimals
- gold: 4 decimals

---

# 10. Validation Order

I also reviewed the order in which errors were generated.

An early implementation could check the customer's balance before confirming that a trusted market price was available.

That could produce a misleading insufficient-balance error when the real issue was pricing.

The flow was therefore adjusted to:

1. Validate request shape.
2. Obtain trusted market price.
3. Calculate execution price.
4. Validate balance/inventory.
5. Create the quote.

This produces a more truthful user-facing error.

---

# 11. Guardrail

The buy-price rule is:

```text
max(market × 1.10, guardrail)
```

I wanted the guardrail to be configurable rather than buried in source code.

### Prompt

> "Make the BUY price guardrail configurable rather than hardcoded. Store it in guardrail_config and have the pricing service read it when calculating the buy execution price. If no guardrail is configured, use market × 1.10."

This makes the behavior easy to verify without changing the pricing formula itself.

---

# 12. Settlement / Confirmation

Confirmation was treated as the most sensitive endpoint.

### Prompt

> "Implement POST /api/trades/confirm for the locked quote flow. The server must use the quote's stored execution price, reject expired quotes, prevent duplicate settlement, re-check balances and inventory, and return the completed trade and updated balances."

The intended flow is:

1. Retrieve quote.
2. Confirm it is active.
3. Confirm it has not expired.
4. Re-check customer balance.
5. Re-check platform inventory.
6. Apply the transfer.
7. Mark the quote settled.
8. Create the trade record.
9. Return updated balances and receipt information.

---

# 13. Locked Quote Ownership

I specifically questioned whether settlement should fetch the latest market price again.

It should not.

Once a customer receives and accepts a quote, the quote owns the execution price.

If the market moves between quote creation and confirmation, silently recalculating the execution price would violate the locked-quote behavior.

Therefore:

> **Settlement uses the execution price stored on the quote.**

---

# 14. Quote Expiry

The server stores the expiry timestamp.

The frontend displays the countdown, but the frontend timer is not the authority.

The server independently checks expiry during confirmation.

If the quote has expired:

- it cannot settle;
- no balance should change;
- the user is told that the quote expired;
- the user can request a new quote.

This provides defense in depth between frontend UX and backend enforcement.

---

# 15. Real Quote-Expiry Issue

During testing I encountered a case where a quote could be created successfully but confirmation returned:

`Quote has expired`

even though the interaction appeared to be within the expected 75-second period.

That led me to inspect:

- `expires_at`;
- PostgreSQL timestamp representation;
- API serialization;
- browser parsing;
- timezone handling;
- and the actual time comparison.

The important design decision remained unchanged: **the server-side expiry is authoritative.**

---

# 16. Settlement Atomicity — Known Gap

One important limitation remains in the current implementation.

The settlement path performs the wallet, inventory, trade, and quote operations through separate database operations rather than one PostgreSQL transaction/RPC boundary.

That means I do **not** want to describe the deployed implementation as fully atomic if the code does not actually provide that guarantee.

The production-grade version should wrap the complete settlement in one transaction:

```text
BEGIN
  validate/lock quote
  validate balances
  update customer wallet
  update platform inventory
  create trade
  mark quote settled
COMMIT
```

If anything fails before commit, the entire settlement should roll back.

I am documenting this as a known hardening gap rather than hiding it.

---

# 17. Basic Frontend

I initially built the basic trading interface myself so that the core product flow could be tested before spending time on visual polish.

The first version included:

- market price;
- customer balances;
- BUY/SELL;
- PKR/GOLD input;
- Get Quote;
- quote review;
- confirmation;
- completion state.

The first UI was intentionally functional and fairly simple.

Once the trading flow worked, I used Copilot to improve the presentation.

---

# 18. UI/UX Enhancement with AI

### Prompt

> "Refine the existing ZarVault interface into a calm, modern financial SaaS experience. Do not change the business logic or API behavior. Improve spacing, hierarchy, responsive behavior, market-price presentation, portfolio visibility, quote review, confirmation, loading states, errors, and success states. Keep it financial and trustworthy without making it look like a trading terminal."

I reviewed the resulting UI rather than accepting every design choice automatically.

## Brand

**ZarVault**

*Pure Gold, Instant Trust*

The interface follows the assessment's visual direction and uses:

- `#0D4A46` — primary teal
- `#8CCB50` — accent green
- `#F9FAFA` — background
- `#1A1F1B` — primary text

The goal was hierarchy and clarity rather than decorative complexity.

---

# 19. Quote UX Improvements

Two frontend states needed additional attention.

## Expired quote

Initially, the quote disappeared when it expired and the main action changed back to Get Quote.

That worked technically, but it made the state transition less clear.

I changed the UX so the expired quote remains visible as an explicit state:

> **Quote expired**

with a clear explanation and a direct option to get a new quote.

## Refresh during an active quote

Another issue was that the countdown disappeared after refreshing the browser because it existed only in client state.

The quote itself is server-side, so the UI should restore an active quote after refresh.

The intended behavior is:

- fetch the current active quote from the server;
- use its server-stored expiry timestamp;
- calculate remaining time;
- if it expired while the page was away, show the expired state.

This avoids creating the impression that a quote disappeared simply because the browser refreshed.

---

# 20. Error and Toast UX

The first implementation relied too heavily on generic errors such as:

`Error: 400`

I replaced that direction with domain-specific messages.

Examples:

- **Insufficient PKR** — show available and required amounts.
- **Insufficient gold** — show available and requested grams.
- **Quote expired** — explain that no trade was executed and offer a new quote.
- **Pricing unavailable** — explain that trading is paused.
- **Settlement failure** — explain that the trade was not completed.

I also added a custom toast system for success, error, warning, and informational states.

---

# 21. Mobile Responsiveness

I reviewed the application at mobile widths instead of treating mobile as a later enhancement.

One issue was that the activity table did not fit comfortably on smaller screens.

The layout was adjusted to move table horizontally.

The goal was to show the activities clearly for the full history journey to remain usable on a phone-sized viewport.

---

# 22. Core Testing

## BUY

Starting state:

- PKR: ₨100,000
- Gold: 10.00000g

Using a representative market price of:

`₨39,539.98/g`

the normal 10% markup gives approximately:

`₨43,493.98/g`

A ₨20,000 buy produces approximately:

`0.45983g`

After settlement:

- PKR: ₨80,000
- Gold: approximately 10.45983g

The end-to-end BUY flow was tested successfully.

## SELL

Using the resulting state, I tested selling 0.5g.

The SELL price follows:

```text
market × 0.90
```

The test verified that:

- the locked sell price was used;
- gold decreased;
- PKR increased;
- the receipt was generated;
- balances remained consistent.

---

# 23. Edge Cases Tested

## Insufficient PKR

I requested more PKR than the wallet contained.

Expected:

- quote creation rejected;
- no settlement;
- clear balance error.

## Quote expiry

I created a quote and allowed the 75-second period to pass.

Expected:

- confirmation rejected;
- no trade created;
- user offered a new quote.

## Repeated confirmation

I attempted to confirm the same quote more than once.

The important invariant is:

> One quote must never create two trades.

## Pricing unavailable

If trusted pricing cannot be obtained:

> **Trading paused — pricing unavailable.**

The portfolio can still be displayed.

---

# 24. How I Used Copilot

The most useful workflow was not:

> "Build the entire trading system."

Instead, I used focused prompts and short iterations.

Typical cycle:

```text
1. Decide what should exist.
2. Ask Copilot for a focused implementation.
3. Read the generated code.
4. Run it.
5. Observe actual behavior.
6. Identify a failure or edge case.
7. Ask a focused follow-up question.
8. Review/change the implementation.
9. Test again.
```

For example:

### AI

> "Here is the quote creation implementation."

### Me

> "What happens if the wallet query itself fails? I don't want a database error to become an insufficient-balance error."

Then:

### Me

> "What happens if this quote is confirmed twice?"

Then:

### Me

> "What happens if the provider returns an invalid price?"

Then:

### Me

> "What happens if the external request hangs?"

This was much more useful than asking the AI to make everything "production ready."

---

# 25. What AI Helped With

Copilot was used for focused implementation and iteration, including:

- project scaffolding;
- SQL/query drafting and review;
- API route implementation;
- pricing-service scaffolding;
- TypeScript/React code;
- validation and error-handling suggestions;
- UI refinement;
- documentation drafts.

---

# 26. What I Personally Owned

The important product and engineering decisions remained under my review:

- overall architecture;
- database model;
- financial precision;
- quote lifecycle;
- pricing rules;
- validation order;
- error semantics;
- balance consistency;
- provider integration verification;
- runtime debugging;
- basic UI flow;
- visual direction;
- testing;
- and known limitations.

Generated code was treated as a starting point, not as evidence that the implementation was correct.

---

# 27. Development Issues Summary

| Issue | What happened | Resolution / status |
|---|---|---|
| Wallet permission error | Supabase returned `42501` | Server-side admin client and permissions reviewed |
| Misleading insufficient-PKR error | DB lookup failure was interpreted as missing funds | Explicitly handled `walletError` |
| `side is not defined` | Debug logging was outside variable scope | Moved logging into the relevant function |
| Quotes permission error | `quotes` table access was denied | Required server-role privileges granted |
| PakGold dependency/DNS error | `api.gold-api.com` returned `ENOTFOUND` | Investigated the real source behavior |
| GoldPrice.org response mismatch | HTML page was treated as JSON | Source-specific fallback handling identified as necessary |
| Quote expired unexpectedly | Confirmation reported expiry during testing | Timestamp/expiry handling investigated |
| Initial UI too basic | Core form worked but lacked polished hierarchy | UI redesigned/refined |
| Countdown lost on refresh | Timer existed only in client state | Active quote should be restored from server state |
| Settlement not fully atomic | Multiple DB operations are separate | Documented as a hardening gap |

---

# 28. Why I Kept the Scope Small

I intentionally did not add:

- authentication;
- real payment processing;
- admin dashboards;
- native mobile apps;
- complex analytics;
- unnecessary charts;
- microservices;
- or a large state-management framework.

Those were not required by the brief.

The core product journey was:

```text
Market price
     ↓
Input
     ↓
Locked quote
     ↓
Confirmation
     ↓
Settlement
     ↓
Updated balances + receipt
```

I wanted that journey to be coherent before adding anything else.

---

# 29. What I Would Improve With More Time

The first priorities would be:

### 1. Atomic settlement

Move the complete settlement flow into a PostgreSQL transaction/RPC boundary.

### 2. Pricing-source hardening

Make each source adapter explicitly match the actual provider response format.

### 3. Automated integration tests

Add tests for:

- quote expiry;
- duplicate confirmation;
- concurrent confirmation;
- insufficient balance;
- insufficient inventory;
- pricing failure;
- settlement rollback.

### 4. Observability

Add structured logs for:

- pricing-source success/failure;
- quote creation;
- quote expiry;
- settlement success/failure;
- unexpected database errors.

---

# 30. Final Engineering Principle

The main question I kept returning to was:

> **Does the product still tell the truth?**

If pricing is unavailable, do not invent a price.

If a quote expires, do not trade at another price.

If a database query fails, do not tell the user they simply have insufficient funds.

If confirmation is repeated, do not create another trade.

If settlement can partially fail, the correct long-term answer is atomicity.

That principle mattered more than adding extra features.

---

# 31. Final Status

**Project:** ZarVault — Pure Gold, Instant Trust  
**Status:** Deployed assessment demo  
**AI assistance:** GitHub Copilot  
**Primary stack:** Next.js + TypeScript + Supabase + Vercel

The project was built iteratively. I used AI to accelerate implementation, but I also reviewed generated code, ran it against real services, debugged actual failures, made the product decisions, tested the critical paths, and documented the remaining limitations.

---

## Appendix — Representative AI Prompts

These are representative prompts from the development process, grouped by task. They are included to make the AI-assisted workflow clear without pretending that this document is a verbatim export of every Copilot interaction.

### Architecture

> "Set up a simple Next.js TypeScript application for a single-user gold trading assessment. Keep frontend and server-side API routes in one application."

### Database

> "Review this PostgreSQL schema for financial correctness. Check decimal precision, negative-balance constraints, quote lifecycle, duplicate settlement protection, and indexes."

### Pricing

> "Implement a server-side pricing service with PakGold as primary, GoldPrice.org as fallback, a five-minute cache, freshness information, validation, timeout handling, and a non-tradable state if both sources fail."

### Quote creation

> "Implement quote creation for BUY/SELL and PKR/GOLD input. Use the trusted market price, calculate the execution price, validate balances, and create a 75-second locked quote."

### Debugging

> "The wallet query is failing, but the API is returning INSUFFICIENT_PKR. Help me distinguish a Supabase query error from a genuine insufficient-balance condition."

> "Why am I getting `side is not defined` here? Check the variable scope and show me where the debug statement belongs."

> "The quotes table returns permission denied. Help me identify whether this is a Supabase client/RLS issue or PostgreSQL role permission issue."

### Settlement

> "Review this confirmation flow for duplicate confirmation, quote expiry, changed balances, inventory, and use of the locked execution price."

### UI

> "Improve this existing ZarVault trading interface into a calm, modern financial SaaS experience without changing its business logic or API behavior. Prioritize hierarchy, spacing, quote clarity, responsive design, loading/error states, and confirmation UX."

---

## Final Note on AI Usage

AI assistance was an implementation accelerator, not the source of truth.

The development process was closer to:

**decide → prompt → inspect → run → debug → review → test → iterate**

rather than:

**prompt → copy → submit**.

The real provider/API issues, Supabase permission errors, misleading error handling, scope bug, quote-expiry behavior, and settlement-atomicity limitation are intentionally included because they represent the actual engineering iteration that happened during the build.
