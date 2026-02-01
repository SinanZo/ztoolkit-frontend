# ZToolKit — Backend (Stripe webhooks) — Local dev

This backend is a minimal, production-minded scaffold for Phase 2 (Stripe webhooks).
It is intentionally small so you can run it locally or in Docker and replace the persistence layer.

Quick start (local):

1. Copy `.env.example` → `.env` and set your `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for test mode.
2. Install deps and run:

   ```bash
   cd backend
   pnpm install
   node server.js
   ```

   The service will listen on `http://localhost:3000` and expose:
   - `POST /api/stripe/webhook` — Stripe webhook receiver (verifies signature when `STRIPE_WEBHOOK_SECRET` is set)
   - `POST /api/stripe/create-checkout-session` — create Checkout Session (server-side)
   - `GET /api/subscription` — read-only subscription status (demo)

Docker (optional):

```bash
# build + run backend
docker compose up --build backend
```

Stripe CLI (webhook testing):

```bash
# forward live/test webhook events to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,invoice.paid,invoice.payment_failed,\
  customer.subscription.created,customer.subscription.updated,customer.subscription.deleted
```

Testing idempotency:

- The server writes processed event IDs to `backend/.processed_events.json` in dev.
- Replaying events with the same `id` will be ignored (idempotent).

Production notes:
- Replace file-backed store with a DB (Postgres, Redis) and persist user/subscription state.
- Verify `successUrl`/`cancelUrl` server-side or build them using your canonical origin.
- Secure `/api/subscription` with authentication (JWT/session) — do not expose user data publicly.

See `backend/stripe.contract.md` for the request/response contract and webhook event list.