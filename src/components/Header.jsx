import React, { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="font-extrabold text-2xl text-black tracking-tight flex items-center gap-2">
          <span>ZToolKit</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Beta</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex gap-6 items-center">
          <Link
            to="/tools"
            className={`font-semibold text-sm transition hover:text-primary ${
              pathname === "/tools" ? "text-primary font-bold" : "text-grey"
            }`}
          >
            {t("nav.tools")}
          </Link>
          <Link
            to="/pricing"
            className={`font-semibold text-sm transition hover:text-primary ${
              pathname === "/pricing" ? "text-primary font-bold" : "text-grey"
            }`}
          >
            {t("nav.pricing")}
          </Link>
          <LanguageSwitcher />
          <Link
            to="/tools"
            className="ml-2 px-4 py-2 rounded-xl bg-primary text-white font-bold shadow-soft hover:bg-primary-accent transition flex items-center gap-1.5 text-sm"
          >
            {t("nav.getStarted")} <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-black/10 hover:bg-grey-light text-black"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/5 bg-white px-4 py-4 flex flex-col gap-3 shadow-soft">
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold py-1.5 ${pathname === "/tools" ? "text-primary font-bold" : "text-grey"}`}
          >
            {t("nav.tools")}
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold py-1.5 ${pathname === "/pricing" ? "text-primary font-bold" : "text-grey"}`}
          >
            {t("nav.pricing")}
          </Link>
          <Link
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full mt-2 py-2.5 rounded-xl bg-primary text-white text-center font-bold text-sm shadow-soft"
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      )}
    </header>
  );
}
