import { test, expect } from '@playwright/test';

// Helper: POST a webhook fixture to the backend to seed a subscription for email
async function seedSubscription(context, fixturePath, email) {
  const fs = await import('fs');
  const raw = fs.readFileSync(fixturePath, 'utf8');
  const payload = JSON.parse(raw);
  payload.id = `${payload.id}_${Date.now()}`;
  payload.data = payload.data || {};
  payload.data.object = payload.data.object || {};
  payload.data.object.metadata = { ...(payload.data.object.metadata || {}), email };

  const api = context.request || context;
  const res = await api.post('http://localhost:3000/api/stripe/webhook', {
    data: payload,
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
}

test.describe('Subscription gating (minimal)', () => {
  test('Free user sees Pro tool locked', async ({ page }) => {
    await page.goto('/?demo_email=free@ci.test');
    await expect(page.locator('text=PRO').first()).toBeVisible();
    await expect(page.getByText('Locked', { exact: true }).first()).toBeVisible();
  });

  test('Pro subscription unlocks Pro tools (seed via webhook)', async ({ page, request }) => {
    await seedSubscription(request, './backend/tests/fixtures/customer.subscription.created.json', 'pro@ci.test');
    await page.goto('/?demo_email=pro@ci.test');
    await expect(page.getByText('Locked', { exact: true })).toBeHidden({ timeout: 5000 });
    await expect(page.getByText('Open Tool', { exact: true }).first()).toBeVisible();
  });

  test('Pricing CTA shows graceful error when backend cannot create session', async ({ page }) => {
    await page.goto('/pricing');
    const upgrade = page.locator('text=Upgrade to Pro');
    await expect(upgrade).toBeVisible();
    await page.route('**/api/stripe/create-checkout-session', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'simulated' }) });
    });
    await upgrade.click();
    await expect(page.locator('role=alert').first()).toContainText(/failed|error/i);
  });
});
