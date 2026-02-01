import React, { useCallback, useState } from "react";
import { createCheckoutSession } from "../lib/stripe";
import { ENV } from "../config/env";
import useSubscription from "../hooks/useSubscription";

export default function PricingCard({ plan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loading: subLoading, isPro: userIsPro, plan: userPlan } = useSubscription();

  const handleUpgrade = useCallback(async () => {
    setError(null);

    // Non-checkout CTAs (e.g. Contact Sales / Free) should be handled elsewhere
    if (!plan.stripePriceId) {
      setError('No checkout available for this plan.');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/?checkout=success&plan=${plan.id}`;
      const cancelUrl = `${origin}/?checkout=cancel&plan=${plan.id}`;

      const payload = await createCheckoutSession({
        priceId: plan.stripePriceId,
        planId: plan.id,
        successUrl,
        cancelUrl,
        apiBase: ENV.API_BASE,
      });

      // Backend should return a URL to redirect the user to Stripe Checkout
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      // fallback: if sessionId provided, attempt client redirect using Stripe.js (not required)
      if (payload?.sessionId) {
        // In Phase 1 we prefer the backend-provided URL to avoid exposing publishable key.
        throw new Error('session_created_no_url');
      }

      throw new Error('invalid_checkout_response');
    } catch (err) {
      console.error('checkout error', err);
      setError(err?.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  }, [plan]);

  const isCheckoutAvailable = Boolean(plan.stripePriceId);

  return (
    <div
      className={`rounded-2xl border p-8 flex flex-col justify-between transition
        ${plan.highlighted
          ? "border-primary bg-offwhite-light scale-[1.03] shadow-xl"
          : "border-grey-light bg-white"}
      `}
    >
      <div>
        <h3 className="text-xl font-bold text-black mb-2">{plan.name}</h3>
        <p className="text-grey text-sm mb-4">{plan.description}</p>

        <div className="text-3xl font-extrabold text-black mb-6">{plan.price}</div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-grey">
              <span className="text-primary">✔</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-3" role="alert">{error}</div>
      )}

      <button
        onClick={isCheckoutAvailable ? handleUpgrade : undefined}
        disabled={loading || (userPlan === plan.id && userIsPro)}
        className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-3
          ${plan.highlighted
            ? "bg-primary text-white hover:bg-primary-accent"
            : "border border-grey-light hover:border-primary"}
          ${loading || (userPlan === plan.id && userIsPro) ? 'opacity-70 cursor-wait' : ''}
        `}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : userPlan === plan.id && userIsPro ? (
          `You're on ${plan.name}`
        ) : (
          plan.cta
        )}
      </button>

      {!isCheckoutAvailable && plan.id === 'business' && (
        <div className="mt-3 text-xs text-grey">Contact sales for team / enterprise plans.</div>
      )}
    </div>
  );
}
