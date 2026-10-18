# Stripe integration — Phase 1 contract (backend)

## Purpose
Defines the HTTP contract the frontend will call to create a Stripe Checkout Session. The backend holds Stripe secret keys and performs the authoritative session creation.

---

## Endpoint
POST /api/stripe/create-checkout-session

### Request (JSON)
{
  "priceId": "price_1234",
  "planId": "pro",            // friendly plan id
  "successUrl": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://example.com/cancel",
  "metadata": { "userId": "optional" }
}

- All fields except `metadata` are required.
- `priceId` must be a valid Stripe Price ID (starts with `price_`).

### Response (JSON) — 200
{ "url": "https://checkout.stripe.com/pay/cs_test_..." }

- Prefer returning `url` for the frontend to forward the customer to Checkout.
- `sessionId` MAY be returned as a fallback.

### Errors
- 400 — invalid request (missing/invalid priceId)
- 402 — payment required / price unavailable
- 500 — server error

---

## Webhook events (spec)
Phase 1 will NOT implement webhooks; Phase 2 implements the webhook receiver and handlers for the following events:
- `checkout.session.completed` — primary: confirm subscription active
- `customer.subscription.created` — initial subscription record
- `customer.subscription.updated` — plan changes, cancellations
- `customer.subscription.deleted` — subscription cancelled
- `invoice.paid` / `invoice.payment_failed` — billing lifecycle

Webhook payloads MUST be verified with Stripe's signature (use `stripe.webhooks.constructEvent`).

### Local testing (Stripe CLI)
Use the Stripe CLI to forward events to your local server during development:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,customer.subscription.created,\
  customer.subscription.updated,invoice.paid,invoice.payment_failed
```

### Idempotency
- Handlers must be idempotent: keep a record of processed `event.id` values and ignore duplicates.
- In this repo the dev server persists processed event IDs to `backend/.processed_events.json`. Replace with a DB-backed idempotency log in production.

### Subscription read API
To power the frontend read-only hook, implement:
GET /api/subscription -> { plan, status, isPro, currentPeriodEnd }
- Must be authenticated in production (returns user-specific data)
- Frontend will use this endpoint via `useSubscription()` (read-only) to gate UI.


---

## Security
- Secrets (Stripe API keys) MUST only live on the server.
- Validate `successUrl`/`cancelUrl` against a allowlist or build them server-side using the site's canonical origin.

---

## Example Node.js (express) sketch
```js
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const { priceId, successUrl, cancelUrl, metadata } = req.body;
  if (!priceId) return res.status(400).json({ error: 'missing_price' });
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { app: 'ztoolkit', ...metadata },
  });
  res.json({ url: session.url });
});
```
