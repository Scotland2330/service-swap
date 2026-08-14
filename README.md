# ServiceSwap

A marketplace where small businesses **trade services of equivalent value** instead of paying cash. Give what you're great at, get what you need, and keep your runway intact.

Built for bootstrapped founders who have a skill set but not the budget to hire — barter, but structured and fair.

## What it does

Think of it as a services marketplace (like Thumbtack) where you pay with your own skills instead of cash — with a cash top-up option for when a trade doesn't quite balance.

- **Business profiles** — register, log in, and build a public profile (bio, industry, location, logo color).
- **Service listings** — publish the services you offer, each with a value: an **hourly rate** (value = rate × hours) or a **fixed project price**.
- **Browse & search** — find services by keyword or category across all businesses.
- **Post a request (Thumbtack-style)** — describe what you *need* and let other businesses send you offers to fulfill it. Discovery works both ways: browse services *or* browse open requests.
- **Propose a swap** — offer one of your services in exchange for another. A live **value-equivalence calculator** shows how balanced the trade is (in dollars and as a fairness %), so nobody feels short-changed.
- **Trade + cash top-up** — when the two sides don't match, add cash to close the gap. The calculator suggests the exact amount to balance, and one click ("Balance it") fills it in. Trade what you can, pay a little to make it happen — all the way up to a near-cash purchase.
- **Manage agreements** — accept, decline, withdraw, and mark swaps complete. Every proposal has a message thread and a full activity timeline, plus optional written terms. Accepting an offer on a request automatically marks that request fulfilled.
- **Dashboard** — track incoming proposals, active swaps, completed trades, your posted requests, and the total value you've traded without spending cash.

## Tech stack

- **Next.js 15** (App Router, React 19, Server Actions) + **TypeScript**
- **Prisma ORM** with **SQLite** — zero external services, runs anywhere
- **Tailwind CSS**
- **JWT session cookies** (`jose`) with **bcrypt**-hashed passwords
- **Zod** for input validation

Everything is self-contained: no external database, auth provider, or API keys required.

## Getting started

```bash
npm install          # installs deps and generates the Prisma client
npm run db:push      # creates the SQLite database (prisma/dev.db)
npm run db:seed      # loads demo businesses, services, and swaps
npm run dev          # http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

### Demo accounts

The seed creates three businesses (password for all: `password123`):

| Email | Business |
|-------|----------|
| `hello@brightleaf.studio` | Brightleaf Studio (design) |
| `team@ledgerly.co` | Ledgerly Bookkeeping (finance) |
| `sam@covalent.legal` | Covalent Legal (legal) |

They come pre-loaded with listed services, a pending proposal, and a completed swap so you can explore both sides of a trade immediately.

## How the value model works

Every service has a value, expressed one of two ways:

- **Hourly** — you set a rate; the swap value is `rate × hours`.
- **Fixed** — one set price for the whole project.

When you propose a swap you pick how much of each side is on the table (e.g. *25 hours of bookkeeping* for *1 brand package*). ServiceSwap compares the two dollar totals and reports a **fairness score** — within ~5% (or $10) counts as *balanced*.

If the sides don't match, **cash closes the gap**. Say your service is worth $600 and theirs is worth $750 — the calculator suggests a $150 top-up from your side, and the fairness meter recomputes to balanced once it's included. Cash always flows from the short side (the payer is derived server-side, so it can't be spoofed). Push the cash all the way to the full value and it becomes a near-cash purchase. You can still send an unbalanced offer; the app just makes the imbalance visible to both parties before anyone commits.

### Requests

A request is the mirror image of a listing: instead of advertising what you offer, you post what you *need*. Other businesses respond with **offers** — each offer is a normal swap proposal linked to the request, so it flows through the same balance calculator, cash top-up, messaging, and accept/decline lifecycle. Accepting one offer marks the request fulfilled.

## Project structure

```
prisma/
  schema.prisma          # Business, Service, SwapProposal, ProposalEvent
  seed.ts                # demo data
src/
  lib/
    auth.ts              # JWT sessions, password hashing
    db.ts                # Prisma client singleton
    value.ts             # value & fairness calculations
    constants.ts         # categories, industries
    actions/             # server actions (auth, services, swaps, profile)
  components/            # UI + forms (server & client components)
  app/
    page.tsx             # landing page
    (auth)/              # login, register
    (app)/               # dashboard, services, swaps, profile, businesses
```

## Data model

- **Business** — account + public profile. Owns services and proposals.
- **Service** — an offering with a category and pricing model (hourly/fixed).
- **SwapProposal** — links an offered service + quantity to a requested service + quantity, with value snapshots, status (`PENDING → ACCEPTED → COMPLETED`, or `DECLINED`/`CANCELLED`), message, and terms.
- **ProposalEvent** — an append-only activity log (created, accepted, declined, completed, messages).

## Notes

- `AUTH_SECRET` in `.env` is a development placeholder — set a strong secret in any real deployment.
- SQLite is used for portability; the Prisma schema swaps to Postgres/MySQL with a one-line datasource change.
