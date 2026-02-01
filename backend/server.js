import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';
import cors from 'cors';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' }) : null;

// Simple file-backed idempotency store for dev. Replace with DB in prod.
const EVENTS_FILE = path.resolve(process.cwd(), 'backend', '.processed_events.json');
let processed = new Set();
try {
  const raw = fs.readFileSync(EVENTS_FILE, 'utf8');
  const arr = JSON.parse(raw || '[]');
  processed = new Set(arr);
} catch (err) {
  processed = new Set();
}
function markProcessed(id) {
  processed.add(id);
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(Array.from(processed), null, 2));
  } catch (e) {
    console.warn('failed to persist processed events', e.message);
  }
}
function isProcessed(id) {
  return processed.has(id);
}

app.use(cors());
app.get('/api/health', (req, res) => res.json({ ok: true }));

// lightweight public API for frontend to check current subscription state (read-only)
// In prod this should be authenticated and return the real user subscription.
app.get('/api/subscription', express.json(), (req, res) => {
  // For Phase 2 we return a safe default; TODO: wire to real DB/user
  res.json({
    plan: 'free',
    status: 'inactive',
    isPro: false,
    currentPeriodEnd: null,
  });
});

// Create Checkout Session (server-side) — uses stripe SDK when configured, otherwise returns a helpful error
app.post('/api/stripe/create-checkout-session', express.json(), async (req, res) => {
  const { priceId, planId, successUrl, cancelUrl, metadata } = req.body || {};
  if (!priceId) return res.status(400).json({ error: 'missing_priceId' });

  if (!stripe) {
    // Helpful dev-mode fallback so frontend can be exercised without secrets
    console.warn('Stripe secret not configured — returning mocked session URL for price:', priceId);
    return res.json({ url: `https://checkout.stripe.com/test_fallback?price=${priceId}` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { app: 'ztoolkit', plan: planId, ...metadata },
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('stripe.create.session.error', err);
    res.status(500).json({ error: err.message || 'stripe_error' });
  }
});

// Webhook endpoint — verifies signature when STRIPE_WEBHOOK_SECRET is set.
// IMPORTANT: use raw body for signature verification.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  if (STRIPE_WEBHOOK_SECRET && stripe) {
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.warn('⚠️  webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Dev-mode: parse JSON without verification
    try {
      event = JSON.parse(req.body.toString('utf8'));
      console.warn('Webhook running in dev-mode (no signature verification)');
    } catch (err) {
      return res.status(400).send('invalid_payload');
    }
  }

  // Idempotency: ignore previously processed events
  if (isProcessed(event.id)) {
    console.log('event already processed:', event.id);
    return res.status(200).json({ received: true, idempotent: true });
  }

  // Handle relevant events
  (async () => {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          // Fulfill the purchase: create subscription record, etc.
          console.log('checkout.session.completed', event.id);
          // TODO: retrieve session, customer and create DB record
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          console.log('subscription lifecycle event:', event.type);
          // TODO: update user subscription in DB (status, period_end, plan)
          break;
        case 'invoice.paid':
          console.log('invoice.paid', event.id);
          break;
        case 'invoice.payment_failed':
          console.log('invoice.payment_failed', event.id);
          break;
        default:
          console.log('unhandled event type', event.type);
      }

      // mark processed (idempotency)
      markProcessed(event.id);
    } catch (err) {
      console.error('webhook handler error', err);
    }
  })();

  res.json({ received: true });
});

// Dev helper to list processed events (not for production)
app.get('/api/debug/processed-events', (req, res) => {
  res.json({ processed: Array.from(processed) });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!stripe) console.warn('Stripe not configured — webhook and checkout will run in dev-mode.');
  if (!STRIPE_WEBHOOK_SECRET) console.warn('Stripe webhook secret not set — verification disabled for dev.');
});
