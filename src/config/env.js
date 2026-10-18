// Lightweight env helper — use import.meta.env only (no secrets in frontend)
export const ENV = {
  STRIPE_PRICE_PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || null,
  STRIPE_PRICE_BUSINESS_MONTHLY:
    import.meta.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || null,
  API_BASE: import.meta.env.VITE_API_BASE || '', // default: same origin
};

export function resolveStripePriceId(planId, fallback) {
  // planId: 'pro' | 'business' | 'free'
  const map = {
    pro: ENV.STRIPE_PRICE_PRO_MONTHLY,
    business: ENV.STRIPE_PRICE_BUSINESS_MONTHLY,
  };
  return map[planId] || fallback || null;
}
