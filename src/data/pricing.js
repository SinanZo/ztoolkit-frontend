export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    // No Stripe price (free tier)
    stripePriceId: null,
    description: "Perfect for casual and one-off usage",
    features: ["Limited daily usage", "Basic tools access", "No account required"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9 / month",
    // developer-friendly fallback id (replace with real IDs via env in production)
    stripePriceId: "price_pro_monthly",
    description: "For professionals and daily workflows",
    features: ["Unlimited tool usage", "All Pro tools unlocked", "Priority processing", "Saved history"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$29 / month",
    stripePriceId: "price_business_monthly",
    description: "For teams and advanced usage",
    features: ["Team access", "API access", "Higher limits", "Priority support"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

// Returns pricing plans with resolved `stripePriceId` (checks VITE_* env via resolveStripePriceId)
import { resolveStripePriceId } from "../config/env";

export function getPricingPlans() {
  return pricingPlans.map((p) => ({
    ...p,
    stripePriceId: resolveStripePriceId(p.id, p.stripePriceId),
  }));
}
