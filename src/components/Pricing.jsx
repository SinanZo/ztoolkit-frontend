import React from "react";
import PricingCard from "./PricingCard";
import { pricingPlans } from "../data/pricing";

export default function Pricing() {
  return (
    <section className="bg-offwhite py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-extrabold text-black mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-grey max-w-xl mx-auto mb-16">
          Choose the plan that fits your workflow. Upgrade or downgrade anytime.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
