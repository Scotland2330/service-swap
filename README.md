# ServiceSwap

A marketplace where small businesses **trade services of equivalent value** instead of paying cash. Give what you're great at, get what you need, and keep your runway intact.

Built for bootstrapped founders who have a skill set but not the budget to hire — barter, but structured and fair.

## What it does

- **Business profiles** — register, log in, and build a public profile (bio, industry, location, logo color).
- **Service listings** — publish the services you offer, each with a value: an **hourly rate** (value = rate × hours) or a **fixed project price**.
- **Browse & search** — find services by keyword or category across all businesses.
- **Propose a swap** — offer one of your services in exchange for another. A live **value-equivalence calculator** shows how balanced the trade is (in dollars and as a fairness %), so nobody feels short-changed.
- **Manage agreements** — accept, decline, withdraw, and mark swaps complete. Every proposal has a message thread and a full activity timeline, plus optional written terms.
- **Dashboard** — track incoming proposals, active swaps, completed trades, and the total value you've traded without spending cash.

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

When you propose a swap you pick how much of each side is on the table (e.g. *25 hours of bookkeeping* for *1 brand package*). ServiceSwap compares the two dollar totals and reports a **fairness score** — within ~5% (or $10) counts as *balanced*. You can still propose an unbalanced trade; the app just makes the imbalance visible to both parties before anyone commits.

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
