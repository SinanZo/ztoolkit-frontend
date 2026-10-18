import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import Stripe from 'stripe';
import cors from 'cors';
import db from './db.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { apiVersion: '2022-11-15' }) : null;

app.use(cors());
app.get('/api/health', (req, res) => res.json({ ok: true, status: 'healthy', dbAvailable: db.isDbAvailable() }));

// Public read API for frontend to check subscription state
app.get('/api/subscription', express.json(), async (req, res) => {
  const email = req.query.email;
  if (email) {
    const sub = await db.getSubscriptionByEmail(email);
    if (sub) return res.json(sub);
  }

  res.json({
    plan: 'free',
    status: 'inactive',
    isPro: false,
    currentPeriodEnd: null,
  });
});

// Create Checkout Session (server-side)
app.post('/api/stripe/create-checkout-session', express.json(), async (req, res) => {
  const { priceId, planId, successUrl, cancelUrl, metadata } = req.body || {};
  if (!priceId) return res.status(400).json({ error: 'missing_priceId' });

  // In production, prohibit development placeholder prices
  const isPlaceholderPrice =
    priceId.startsWith('price_placeholder') ||
    priceId === 'price_pro_monthly' ||
    priceId === 'price_business_monthly';

  if (IS_PROD && isPlaceholderPrice) {
    return res.status(400).json({ error: 'invalid_production_price_id' });
  }

  if (!stripe) {
    if (IS_PROD) {
      return res.status(500).json({ error: 'stripe_not_configured' });
    }
    // Dev-mode fallback
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

// Webhook endpoint — verifies signature in production
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
    // In production, unsigned webhooks are strictly prohibited
    if (IS_PROD) {
      return res.status(400).json({ error: 'unsigned_webhook_prohibited_in_production' });
    }

    // Dev-mode only: parse JSON without signature
    try {
      event = JSON.parse(req.body.toString('utf8'));
      console.warn('Webhook running in dev-mode (no signature verification)');
    } catch (err) {
      return res.status(400).send('invalid_payload');
    }
  }

  // Idempotency check
  if (await db.isEventProcessed(event.id)) {
    console.log('event already processed:', event.id);
    return res.status(200).json({ received: true, idempotent: true });
  }

  // Handle relevant events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const email = session?.customer_details?.email || session?.metadata?.email;
        if (email) {
          await db.upsertUserAndSubscription({
            email,
            stripeCustomerId: session?.customer,
            stripeSub: {
              id: session?.subscription || event.id,
              status: 'active',
              metadata: { plan: session?.metadata?.plan || 'pro' },
              current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
            },
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data?.object;
        const email = sub?.metadata?.email;
        if (email) {
          await db.upsertUserAndSubscription({
            email,
            stripeCustomerId: sub?.customer,
            stripeSub: sub,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        const email = sub?.metadata?.email;
        if (email) {
          await db.upsertUserAndSubscription({
            email,
            stripeCustomerId: sub?.customer,
            stripeSub: { ...sub, status: 'canceled' },
          });
        }
        break;
      }
      default:
        console.log('unhandled event type:', event.type);
    }

    await db.markEventProcessed(event.id, event.type);
  } catch (err) {
    console.error('webhook handler error:', err);
  }

  res.json({ received: true });
});

// Dev helper to inspect DB availability & state
app.get('/api/debug/status', (req, res) => {
  res.json({
    dbAvailable: db.isDbAvailable(),
    nodeEnv: process.env.NODE_ENV || 'development',
    stripeConfigured: Boolean(stripe),
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!stripe) console.warn('Stripe not configured — checkout and webhook in dev fallback mode.');
  if (!STRIPE_WEBHOOK_SECRET) console.warn('Stripe webhook secret not set — dev mode only.');
});
