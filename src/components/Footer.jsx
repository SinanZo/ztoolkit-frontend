import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-black/10 bg-white py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="font-extrabold text-black text-lg">ZToolKit</span>
          <span className="hidden sm:inline text-black/20">|</span>
          <p className="text-xs text-grey">{t("footer.tagline")}</p>
        </div>

        <div className="flex gap-6 text-sm font-semibold text-grey">
          <Link to="/tools" className="hover:text-primary transition">
            {t("nav.tools")}
          </Link>
          <Link to="/pricing" className="hover:text-primary transition">
            {t("nav.pricing")}
          </Link>
        </div>

        <span className="text-grey text-xs">
          © {new Date().getFullYear()} ZToolKit. {t("footer.rights")}
        </span>
      </div>
    </footer>
  );
}
