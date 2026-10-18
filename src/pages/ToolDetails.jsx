import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Combine,
  QrCode,
  Image,
  Code2,
  Sparkles,
  Scissors,
  Hash,
  Wrench,
  ArrowLeft,
  Clock,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { tools } from "../data/tools.js";

const ICON_MAP = {
  FileText,
  Combine,
  QrCode,
  Image,
  Code2,
  Sparkles,
  Scissors,
  Hash,
};

export default function ToolDetails() {
  const { id } = useParams();
  const { t } = useTranslation();

  const tool = tools.find((t) => t.id === id || t.slug === id);

  if (!tool) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl border border-black/10 bg-white p-12 text-center shadow-soft mt-8">
        <h2 className="text-xl font-extrabold text-black mb-2">{t("toolDetails.notFound")}</h2>
        <p className="text-sm font-semibold text-grey mb-6">
          The requested tool could not be found in the current registry.
        </p>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-2.5 text-sm font-extrabold text-white hover:opacity-90 transition"
        >
          <ArrowLeft className="h-4 w-4" /> {t("toolDetails.backToTools")}
        </Link>
      </div>
    );
  }

  const IconComponent = ICON_MAP[tool.icon] || Wrench;
  const isPro = Boolean(tool.pro);

  return (
    <section className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-grey hover:text-black transition"
        >
          <ArrowLeft className="h-4 w-4" /> {t("toolDetails.backToTools")}
        </Link>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-soft">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                isPro
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-black/10 bg-grey-light text-black"
              }`}
            >
              <IconComponent className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-black tracking-tight">{tool.name}</h1>
              <span className="text-xs font-semibold text-grey">{tool.category}</span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
              isPro
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-grey-light bg-grey-light text-black"
            }`}
          >
            {isPro ? <Lock className="h-3 w-3" /> : null}
            {isPro ? "PRO" : "FREE"}
          </span>
        </div>

        {/* Description */}
        <p className="mt-5 text-base font-medium text-grey leading-relaxed">
          {tool.description}
        </p>

        {/* Development Status Notice */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {t("toolDetails.inDevelopment")}
              </h3>
              <p className="mt-1 text-xs font-medium text-amber-800 leading-normal">
                {t("toolDetails.previewNotice")}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-grey-light pt-6">
          <div>
            <span className="text-xs font-bold text-grey uppercase tracking-wider">
              {t("toolDetails.category")}
            </span>
            <p className="text-sm font-extrabold text-black mt-1">{tool.category}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-grey uppercase tracking-wider">
              {t("toolDetails.tier")}
            </span>
            <p className="text-sm font-extrabold text-black mt-1">
              {isPro ? "Pro Subscription" : "Free Access"}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-grey-light pt-6">
          <Link
            to="/pricing"
            className="text-sm font-bold text-primary hover:text-primary-accent transition"
          >
            View Subscription Plans →
          </Link>

          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-2xl bg-grey-light px-6 py-2.5 text-sm font-bold text-grey"
          >
            Engine Under Construction
          </button>
        </div>
      </div>
    </section>
  );
}
