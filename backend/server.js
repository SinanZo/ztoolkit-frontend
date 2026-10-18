import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import Stripe from 'stripe';
import cors from 'cors';
import db from './db.js';
import { authenticateRequest } from './auth.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic environment getters to avoid stale module cache during runtime reconfiguration
const isProd = () => process.env.NODE_ENV === 'production';
const isCheckoutEnabled = () => process.env.CHECKOUT_ENABLED === 'true';
const getWebhookSecret = () => process.env.STRIPE_WEBHOOK_SECRET || '';
const getAppOrigin = () => process.env.APP_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173';

const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_API_KEY || '';
  return key ? new Stripe(key, { apiVersion: '2022-11-15' }) : null;
};

// Approved plans mapped to authoritative Stripe price IDs
const getApprovedPlans = () => ({
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  business: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
});

// 1. CORS Hardening
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, server-to-server) without origin header
      if (!origin) return callback(null, true);

      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      if (allowedOrigins.includes(origin) || (!isProd() && origin.includes('localhost'))) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    },
    credentials: true,
  })
);

// 2. Security Headers & Request Safeguards
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProd()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// 3. Health Check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', dbAvailable: db.isDbAvailable() });
});

// 4. Safe Subscription Status API
// Query-param lookup (?email=...) is strictly removed.
// Anonymous requests receive safe unprivileged Free status.
// Private subscription data requires verified authentication identity.
app.get('/api/subscription', express.json({ limit: '10kb' }), async (req, res, next) => {
  try {
    const user = authenticateRequest(req);
    if (!user) {
      // Return safe, non-sensitive anonymous Free response
      return res.json({
        plan: 'free',
        status: 'inactive',
        isPro: false,
        currentPeriodEnd: null,
      });
    }

    // Authenticated identity verified: query user's subscription
    let sub = await db.getSubscriptionByUserId(user.id);
    if ((!sub || !sub.isPro) && user.email) {
      sub = await db.getSubscriptionByEmail(user.email);
    }
    return res.json(sub || db.computeSubscriptionState(null));
  } catch (err) {
    next(err);
  }
});

// 5. Hardened Stripe Checkout Session Creator
app.post('/api/stripe/create-checkout-session', express.json({ limit: '50kb' }), async (req, res, next) => {
  try {
    // Return controlled unavailable response when billing is disabled
    if (!isCheckoutEnabled()) {
      return res.status(503).json({
        error: 'checkout_unavailable',
        message: 'Stripe checkout is temporarily unavailable.',
      });
    }

    const user = authenticateRequest(req);

    // Disable production checkout until full authentication & trusted user binding exist
    if (isProd() && !user) {
      return res.status(401).json({
        error: 'authentication_required',
        message: 'You must be signed in with a verified account to subscribe.',
      });
    }

    const { planId, successUrl, cancelUrl } = req.body || {};
    const approvedPlans = getApprovedPlans();

    if (!planId || !approvedPlans[planId]) {
      return res.status(400).json({
        error: 'invalid_plan',
        message: 'A valid, approved planId is required. Arbitrary prices are prohibited.',
      });
    }

    // Prohibit arbitrary client price IDs
    if (req.body.priceId && req.body.priceId !== approvedPlans[planId]) {
      return res.status(400).json({
        error: 'invalid_price_id',
        message: 'Arbitrary client price IDs are strictly prohibited.',
      });
    }

    const priceId = approvedPlans[planId];

    // Prohibit placeholder price IDs in production
    const isPlaceholderPrice =
      priceId.startsWith('price_placeholder') ||
      priceId === 'price_pro_monthly' ||
      priceId === 'price_business_monthly';

    if (isProd() && isPlaceholderPrice) {
      return res.status(400).json({ error: 'invalid_production_price_id' });
    }

    // Validate redirect URLs against allowlisted application origin
    const appOrigin = getAppOrigin();
    const appBaseUrl = new URL(appOrigin);
    const allowedOrigin = appBaseUrl.origin;

    if (successUrl) {
      try {
        const parsed = new URL(successUrl);
        if (parsed.origin !== allowedOrigin) {
          return res.status(400).json({
            error: 'unauthorized_redirect_url',
            message: 'Redirect URLs must match the application origin.',
          });
        }
      } catch {
        return res.status(400).json({ error: 'malformed_redirect_url' });
      }
    }

    if (cancelUrl) {
      try {
        const parsed = new URL(cancelUrl);
        if (parsed.origin !== allowedOrigin) {
          return res.status(400).json({
            error: 'unauthorized_redirect_url',
            message: 'Redirect URLs must match the application origin.',
          });
        }
      } catch {
        return res.status(400).json({ error: 'malformed_redirect_url' });
      }
    }

    const finalSuccessUrl = successUrl || `${allowedOrigin}/?checkout=success&plan=${encodeURIComponent(planId)}`;
    const finalCancelUrl = cancelUrl || `${allowedOrigin}/pricing?checkout=canceled`;

    // Server-controlled authoritative metadata (client metadata ignored)
    const authoritativeMetadata = {
      app: 'ztoolkit',
      plan: planId,
      userId: user ? user.id : 'anonymous',
    };

    const stripe = getStripeClient();
    if (!stripe) {
      if (isProd()) {
        return res.status(500).json({ error: 'stripe_not_configured' });
      }
      return res.json({
        url: `https://checkout.stripe.com/test_fallback?price=${encodeURIComponent(priceId)}`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: user?.email,
      metadata: authoritativeMetadata,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

function isValidStripeEvent(event) {
  if (!event || typeof event !== 'object') return false;
  if (typeof event.id !== 'string' || !event.id.startsWith('evt_')) return false;
  if (typeof event.type !== 'string' || !event.type.includes('.')) return false;
  if (!event.data || typeof event.data !== 'object' || !event.data.object) return false;
  return true;
}

// 6. Hardened Stripe Webhook Endpoint
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '2mb' }), async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const webhookSecret = getWebhookSecret();
  const stripe = getStripeClient();
  let event;

  if (isProd() || webhookSecret) {
    if (!signature) {
      return res.status(400).json({ error: 'missing_stripe_signature' });
    }
    if (!webhookSecret) {
      return res.status(500).json({ error: 'stripe_webhook_unconfigured' });
    }
    try {
      const stripeInstance = stripe || new Stripe('sk_test_placeholder', { apiVersion: '2022-11-15' });
      event = stripeInstance.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.warn('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'invalid_stripe_signature' });
    }
  } else {
    // Non-production test fallback only if allowed or in test/CI
    const allowUnsigned = !isProd() && (
      process.env.ALLOW_DEV_UNSIGNED_WEBHOOKS === 'true' ||
      Boolean(process.env.CI) ||
      process.env.NODE_ENV === 'test'
    );

    if (!allowUnsigned) {
      return res.status(400).json({ error: 'missing_stripe_signature' });
    }
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'invalid_json_payload' });
    }
  }

  // Reject malformed events
  if (!isValidStripeEvent(event)) {
    return res.status(400).json({ error: 'malformed_event' });
  }

  // Persistent, transactionally safe idempotency check
  try {
    if (await db.isEventProcessed(event.id)) {
      return res.status(200).json({ received: true, idempotent: true });
    }
  } catch (err) {
    return res.status(500).json({ error: 'idempotency_check_failed' });
  }

  // Authoritative event processing
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const email = session?.customer_details?.email || session?.metadata?.email;
        const subscriptionId = session?.subscription;

        if (!email) {
          return res.status(400).json({ error: 'missing_customer_email' });
        }

        let stripeSub = null;
        if (subscriptionId && stripe) {
          try {
            stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          } catch (err) {
            console.warn('Stripe subscription retrieval error:', err.message);
          }
        }

        if (!stripeSub) {
          const periodEnd = session?.subscription_data?.current_period_end || session?.current_period_end;
          stripeSub = {
            id: subscriptionId || session.id,
            status: session.payment_status === 'paid' ? 'active' : 'incomplete',
            metadata: { plan: session?.metadata?.plan || 'pro' },
            current_period_end: periodEnd || null,
          };
        }

        const persisted = await db.upsertUserAndSubscription({
          email,
          stripeCustomerId: session?.customer,
          stripeSub,
        });

        if (!persisted) {
          throw new Error('Database persistence failed');
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data?.object;
        const email = sub?.metadata?.email;
        if (!email) {
          return res.status(400).json({ error: 'missing_subscription_email' });
        }

        const persisted = await db.upsertUserAndSubscription({
          email,
          stripeCustomerId: sub?.customer,
          stripeSub: sub,
        });

        if (!persisted) {
          throw new Error('Database persistence failed');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data?.object;
        const email = sub?.metadata?.email;
        if (email) {
          const persisted = await db.upsertUserAndSubscription({
            email,
            stripeCustomerId: sub?.customer,
            stripeSub: { ...sub, status: 'canceled' },
          });

          if (!persisted) {
            throw new Error('Database persistence failed');
          }
        }
        break;
      }

      default:
        console.log('Unhandled stripe event:', event.type);
    }

    // Only mark processed after successful persistence
    await db.markEventProcessed(event.id, event.type);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing failure:', err.message);
    // Never acknowledge 200 on database persistence failure so Stripe retries
    return res.status(500).json({ error: 'database_persistence_failed' });
  }
});

// 7. Debug Endpoint — Prohibited in Production
app.get('/api/debug/status', (req, res) => {
  if (isProd()) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json({
    dbAvailable: db.isDbAvailable(),
    nodeEnv: process.env.NODE_ENV || 'development',
    stripeConfigured: Boolean(getStripeClient()),
    checkoutEnabled: isCheckoutEnabled(),
  });
});

// 8. Sanitized Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('API Error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: isProd() ? 'internal_server_error' : (err.message || 'internal_server_error'),
  });
});

export { app };

// Only listen if run directly (e.g. `node server.js`), not when imported in test suites
const isDirectExecution = process.argv[1] && (
  path.resolve(process.argv[1]).endsWith('server.js') ||
  process.argv[1].includes('backend\\server.js') ||
  process.argv[1].includes('backend/server.js')
);

if (isDirectExecution && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}
