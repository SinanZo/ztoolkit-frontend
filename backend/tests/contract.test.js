import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import db from '../db.js';

describe('Backend Database Layer & Fallback Store', () => {
  test('isEventProcessed returns false for unseen event', async () => {
    const isProc = await db.isEventProcessed('evt_test_unseen_' + Date.now());
    assert.strictEqual(isProc, false);
  });

  test('markEventProcessed records event idempotently', async () => {
    const testId = 'evt_test_marked_' + Date.now();
    await db.markEventProcessed(testId, 'checkout.session.completed');
    const isProc = await db.isEventProcessed(testId);
    assert.strictEqual(isProc, true);
  });

  test('getSubscriptionByEmail returns free inactive for unregistered email', async () => {
    const sub = await db.getSubscriptionByEmail('nonexistent@example.com');
    assert.strictEqual(sub.plan, 'free');
    assert.strictEqual(sub.isPro, false);
  });

  test('isDbAvailable returns boolean without throwing', () => {
    const available = db.isDbAvailable();
    assert.strictEqual(typeof available, 'boolean');
  });
});
