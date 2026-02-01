Running E2E locally

1) Start Postgres (optional - only needed to exercise backend DB flows):

   docker compose up -d postgres

2) Start backend (or run migrations first if you enabled DB):

   # with DB
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/ztoolkit pnpm --dir backend prisma:migrate
   pnpm --dir backend dev

   # without DB (dev fallback)
   pnpm --dir backend dev

3) Start frontend preview:

   pnpm build && pnpm preview

4) Run Playwright (from repo root):

   pnpm e2e

Notes:
- Tests seed subscriptions by POSTing webhook fixtures to /api/stripe/webhook; no real Stripe calls required.
- Use `?demo_email=you@your.test` to simulate authenticated demo users in the UI for local debugging.
