# Deploying ServiceSwap (free hosted link)

This gets you a public URL you can share, using two free services:

- **Neon** — a hosted Postgres database (free tier)
- **Vercel** — hosting for the Next.js app (free "Hobby" tier)

The code is already Postgres-ready and configured to create its own tables on
first deploy. Total time: ~10–15 minutes. You'll need a GitHub account (the repo
is already there) — Neon and Vercel both let you sign in with GitHub.

---

## Step 1 — Create the database (Neon)

1. Go to **https://neon.tech** and sign up (use "Continue with GitHub").
2. Click **Create project**. Give it any name (e.g. `service-swap`), keep the
   defaults, and create it.
3. On the project dashboard, find the **Connection string** (a.k.a. "Connection
   Details"). **Choose the "Pooled connection" string** — the host will contain
   `-pooler`. It looks like:
   ```
   postgresql://alex:npg_xxxxxxxx@ep-cool-name-12345-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy it** — this is your `DATABASE_URL`. Keep the tab open.

## Step 2 — Deploy the app (Vercel)

1. Go to **https://vercel.com** and sign up with GitHub.
2. Click **Add New… → Project**, then **Import** the `service-swap` repository.
3. On the configure screen, set the **Production Branch** / branch to deploy to
   `claude/service-swap-marketplace-z11oh4` (or merge it to `main` first and use
   `main`). Framework preset should auto-detect as **Next.js** — leave the build
   settings as-is (the repo defines a `vercel-build` script that creates the DB
   tables automatically).
4. Expand **Environment Variables** and add two:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the Neon **pooled** string you copied in Step 1 |
   | `AUTH_SECRET`  | any long random string — e.g. run `openssl rand -base64 32`, or just mash 40+ random characters |

5. Click **Deploy**. First build takes a couple of minutes. When it finishes
   you'll get a URL like `https://service-swap-xxxx.vercel.app` — **that's your
   shareable link.**

At this point the app is live with **empty** data. You can register a business
right on the site and start using it. If you'd like the demo businesses and
example swaps pre-loaded, do Step 3.

## Step 3 (optional) — Load demo data

On your own computer, with the repo cloned and Node installed:

```bash
# from the project folder
echo 'DATABASE_URL="<your Neon pooled string>"' > .env
echo 'AUTH_SECRET="anything"' >> .env
npm install
npm run db:seed
```

This inserts three demo businesses (all with password `password123`):

- `hello@brightleaf.studio` — Brightleaf Studio (design)
- `team@ledgerly.co` — Ledgerly Bookkeeping (finance)
- `sam@covalent.legal` — Covalent Legal (legal)

…plus a cash-topped swap proposal and a posted request with an offer, so you can
explore both sides immediately. Refresh your Vercel URL and it'll be there.

---

## Notes & troubleshooting

- **Tables are created automatically.** The `vercel-build` script runs
  `prisma db push` against your `DATABASE_URL` during each deploy, so you never
  have to run migrations by hand.
- **Use the *pooled* Neon string** for `DATABASE_URL`. Serverless functions open
  many short-lived connections; the pooler is built for that. The non-pooled
  (direct) string can exhaust connections under load.
- **Changed env vars?** Redeploy from the Vercel dashboard (Deployments → ⋯ →
  Redeploy) so the new values take effect.
- **Local development** now also uses Postgres. Point `.env`'s `DATABASE_URL` at
  your Neon database (or a local Postgres), then `npm run db:push && npm run dev`.
- **Security:** `AUTH_SECRET` signs login cookies — use a real random value in
  production and don't commit it. `.env` is git-ignored.
