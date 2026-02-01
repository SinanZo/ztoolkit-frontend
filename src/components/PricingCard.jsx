import React from "react";

export default function PricingCard({ plan }) {
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

        <div className="text-3xl font-extrabold text-black mb-6">
          {plan.price}
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-grey">
              <span className="text-primary">✔</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`w-full py-3 rounded-xl font-bold transition
          ${plan.highlighted
            ? "bg-primary text-white hover:bg-primary-accent"
            : "border border-grey-light hover:border-primary"}
        `}
      >
        {plan.cta}
      </button>
    </div>
  );
}
