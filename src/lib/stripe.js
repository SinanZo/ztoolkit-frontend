// Client-side helper to create a Checkout Session via the backend contract.
// Frontend only posts planId and safe relative/canonical redirect requests.
// Authoritative pricing and user binding are enforced on the server.

export async function createCheckoutSession({ planId, priceId, successUrl, cancelUrl, apiBase = '' }) {
  const effectivePlanId = planId || (priceId?.includes('business') ? 'business' : 'pro');
  if (!effectivePlanId) throw new Error('planId_required');

  const url = (apiBase || '') + '/api/stripe/create-checkout-session';
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('ztoolkit_auth_token') : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ planId: effectivePlanId, priceId, successUrl, cancelUrl }),
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.message || errorData.error || 'checkout_create_failed');
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  return res.json();
}
