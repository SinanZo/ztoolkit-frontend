import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.js';
import db from '../db.js';

function setEnv(key, val) {
  if (val === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = val;
  }
}

describe('ZToolKit Automated Security Remediation Test Suite', () => {
  let server;
  let baseUrl;

  let origEnv;
  before(async () => {
    origEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_DEV_UNSIGNED_WEBHOOKS = 'true';

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    for (const key of Object.keys(process.env)) {
      if (!(key in origEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(origEnv)) {
      process.env[key] = value;
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Subscription Authorization Security
  describe('P0: Subscription Authorization', () => {
    test('Anonymous request to /api/subscription returns safe, unprivileged Free state', async () => {
      const res = await fetch(`${baseUrl}/api/subscription`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.plan, 'free');
      assert.strictEqual(data.status, 'inactive');
      assert.strictEqual(data.isPro, false);
      assert.strictEqual(data.currentPeriodEnd, null);
    });

    test('Query-param email injection (?email=victim@example.com) is strictly ignored and returns Free state', async () => {
      const res = await fetch(`${baseUrl}/api/subscription?email=victim@example.com&demo_email=victim@example.com`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.plan, 'free');
      assert.strictEqual(data.isPro, false);
      // Ensure victim's data is never exposed
      assert.strictEqual(data.email, undefined);
    });

    test('Invalid Bearer token returns safe anonymous Free state', async () => {
      const res = await fetch(`${baseUrl}/api/subscription`, {
        headers: { Authorization: 'Bearer invalid_garbage_token' },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.plan, 'free');
      assert.strictEqual(data.isPro, false);
    });

    test('Authenticated request with verified user token retrieves active subscription', async () => {
      const origGetSub = db.getSubscriptionByEmail;
      db.getSubscriptionByEmail = async (email) => {
        if (email === 'verified@test.com') {
          return db.computeSubscriptionState({
            plan: 'pro',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 86400000),
          });
        }
        return db.computeSubscriptionState(null);
      };

      try {
        const res = await fetch(`${baseUrl}/api/subscription`, {
          headers: { Authorization: 'Bearer test_user:usr_123:verified@test.com' },
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.plan, 'pro');
        assert.strictEqual(data.isPro, true);
        assert.strictEqual(data.status, 'active');
      } finally {
        db.getSubscriptionByEmail = origGetSub;
      }
    });

    test('computeSubscriptionState correctly marks canceled subscriptions as isPro: false', () => {
      const state = db.computeSubscriptionState({
        plan: 'pro',
        status: 'canceled',
        currentPeriodEnd: new Date(Date.now() + 86400000),
      });
      assert.strictEqual(state.isPro, false);
      assert.strictEqual(state.plan, 'free');
      assert.strictEqual(state.status, 'canceled');
    });

    test('computeSubscriptionState correctly marks expired entitlements as isPro: false', () => {
      const state = db.computeSubscriptionState({
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 3600000), // 1 hour ago
      });
      assert.strictEqual(state.isPro, false);
      assert.strictEqual(state.plan, 'free');
    });

    test('computeSubscriptionState approves valid plan and active future entitlement', () => {
      const future = new Date(Date.now() + 86400000);
      const state = db.computeSubscriptionState({
        plan: 'pro',
        status: 'active',
        currentPeriodEnd: future,
      });
      assert.strictEqual(state.isPro, true);
      assert.strictEqual(state.plan, 'pro');
      assert.strictEqual(state.status, 'active');
    });
  });

  // 2. Stripe Checkout Security
  describe('P0: Stripe Checkout Safeguards', () => {
    test('Controlled unavailable response (503) returned when checkout is disabled', async () => {
      // By default CHECKOUT_ENABLED is false
      const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro' }),
      });
      assert.strictEqual(res.status, 503);
      const data = await res.json();
      assert.strictEqual(data.error, 'checkout_unavailable');
    });

    test('Rejects arbitrary client-supplied price IDs', async () => {
      const origEnabled = process.env.CHECKOUT_ENABLED;
      setEnv('CHECKOUT_ENABLED', 'true');
      try {
        const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'pro',
            priceId: 'price_arbitrary_unapproved_123',
          }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'invalid_price_id');
      } finally {
        setEnv('CHECKOUT_ENABLED', origEnabled);
      }
    });

    test('Rejects malicious / unauthorized redirect URLs outside allowlisted origin', async () => {
      const origEnabled = process.env.CHECKOUT_ENABLED;
      setEnv('CHECKOUT_ENABLED', 'true');
      try {
        const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'pro',
            successUrl: 'https://attacker.evil.com/phishing',
          }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'unauthorized_redirect_url');
      } finally {
        setEnv('CHECKOUT_ENABLED', origEnabled);
      }
    });

    test('Rejects arbitrary / missing planId', async () => {
      const origEnabled = process.env.CHECKOUT_ENABLED;
      setEnv('CHECKOUT_ENABLED', 'true');
      try {
        const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'super_admin_free',
          }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'invalid_plan');
      } finally {
        setEnv('CHECKOUT_ENABLED', origEnabled);
      }
    });
  });

  // 3. Webhook Security & Idempotency
  describe('P0: Webhook Verification & Resilience', () => {
    test('Rejects unsigned webhook when signature is missing in production mode', async () => {
      const origProd = process.env.NODE_ENV;
      setEnv('NODE_ENV', 'production');
      try {
        const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'evt_test_unsigned' }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'missing_stripe_signature');
      } finally {
        setEnv('NODE_ENV', origProd);
      }
    });

    test('Rejects webhook with invalid Stripe signature', async () => {
      const origSecret = process.env.STRIPE_WEBHOOK_SECRET;
      setEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test_secret_for_rejection');
      try {
        const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 't=123,v1=bad_signature',
          },
          body: JSON.stringify({ id: 'evt_test_sig', type: 'customer.subscription.created' }),
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.error, 'invalid_stripe_signature');
      } finally {
        setEnv('STRIPE_WEBHOOK_SECRET', origSecret);
      }
    });

    test('Rejects malformed webhook events missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'not_an_event_id' }), // missing type and data.object
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, 'malformed_event');
    });

    test('Acknowledge replayed events as idempotent without re-processing', async () => {
      const testId = 'evt_replayed_' + Date.now();
      await db.markEventProcessed(testId, 'customer.subscription.created');

      const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: testId,
          type: 'customer.subscription.created',
          data: { object: { id: 'sub_123', customer: 'cus_123' } },
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.idempotent, true);
    });

    test('Failed database persistence never returns 200 and does not mark event processed', async () => {
      const failedId = 'evt_fail_persist_' + Date.now();
      
      // Temporarily sabotage upsert to simulate persistence failure
      const origUpsert = db.upsertUserAndSubscription;
      db.upsertUserAndSubscription = async () => {
        throw new Error('Disk IO or database timeout');
      };

      try {
        const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: failedId,
            type: 'customer.subscription.created',
            data: { object: { id: 'sub_fail', customer: 'cus_fail', metadata: { email: 'fail@test.com' } } },
          }),
        });

        // Must return 500 so Stripe retries
        assert.strictEqual(res.status, 500);
        const data = await res.json();
        assert.strictEqual(data.error, 'database_persistence_failed');

        // Must NOT have marked the event as processed
        const isProcessed = await db.isEventProcessed(failedId);
        assert.strictEqual(isProcessed, false);
      } finally {
        db.upsertUserAndSubscription = origUpsert;
      }
    });

    test('Prohibits file-store fallback in production when database is unavailable', async () => {
      const origProd = process.env.NODE_ENV;
      const origDbUrl = process.env.DATABASE_URL;
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;

      try {
        await assert.rejects(
          async () => {
            await db.isEventProcessed('evt_prod_safety_test');
          },
          /FATAL: Database connection required in production/
        );
      } finally {
        process.env.NODE_ENV = origProd;
        if (origDbUrl) process.env.DATABASE_URL = origDbUrl;
      }
    });
  });

  // 4. Security Hardening & Headers
  describe('P1: Security Hardening & Clean Error Handling', () => {
    test('Includes standard security headers on responses', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
      assert.strictEqual(res.headers.get('x-xss-protection'), '1; mode=block');
    });

    test('CORS blocks unauthorized external browser origins', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        headers: { Origin: 'https://malicious-external-site.com' },
      });
      // Express cors middleware returns either no Access-Control-Allow-Origin or 500 error
      const allowOrigin = res.headers.get('access-control-allow-origin');
      assert.notStrictEqual(allowOrigin, 'https://malicious-external-site.com');
    });
  });
});
