// Client-side helper to create a Checkout Session via the backend contract.
// No secrets here — frontend only POSTs to a backend endpoint which performs the
// secret-backed call to Stripe.

export async function createCheckoutSession({ priceId, planId, successUrl, cancelUrl, metadata = {} , apiBase = '' }) {
  if (!priceId) throw new Error('priceId_required');
  const url = (apiBase || '') + '/api/stripe/create-checkout-session';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, planId, successUrl, cancelUrl, metadata }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error('checkout_create_failed');
    err.status = res.status;
    err.body = text;
    throw err;
  }

  return res.json(); // expected: { url?: string, sessionId?: string }
}
