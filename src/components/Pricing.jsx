import React from "react";
import { useTranslation } from "react-i18next";
import PricingCard from "./PricingCard";
import { getPricingPlans } from "../data/pricing";

export default function Pricing() {
  const { t } = useTranslation();

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight mb-4">
          {t("pricing.title")}
        </h2>
        <p className="text-grey max-w-xl mx-auto mb-12 text-sm md:text-base font-medium">
          {t("pricing.subtitle")}
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-start">
          {getPricingPlans().map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
