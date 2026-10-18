import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-8 md:p-16 shadow-soft">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_40%,#FFF9F4_0%,transparent_70%)]" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t("hero.badge")}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-black tracking-tight leading-tight mb-4">
          {t("hero.title")}
        </h1>

        <p className="text-base md:text-lg font-medium text-grey leading-relaxed mb-8 max-w-2xl mx-auto">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-extrabold text-sm shadow-soft hover:bg-primary-accent transition"
          >
            {t("hero.browseAll")} <ArrowRight size={18} />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-black/10 bg-white text-black font-extrabold text-sm hover:bg-grey-light transition"
          >
            {t("hero.viewPricing")}
          </Link>
        </div>
      </div>
    </section>
  );
}
