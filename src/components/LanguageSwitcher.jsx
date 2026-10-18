import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en').split('-')[0];

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-xs font-bold text-black shadow-soft">
      <Globe className="h-3.5 w-3.5 text-grey" />
      <button
        type="button"
        onClick={() => toggleLanguage('en')}
        className={`rounded-lg px-1.5 py-0.5 transition ${
          currentLang === 'en'
            ? 'bg-black text-white'
            : 'text-grey hover:text-black'
        }`}
      >
        EN
      </button>
      <span className="text-black/20">|</span>
      <button
        type="button"
        onClick={() => toggleLanguage('ar')}
        className={`rounded-lg px-1.5 py-0.5 transition ${
          currentLang === 'ar'
            ? 'bg-black text-white'
            : 'text-grey hover:text-black'
        }`}
      >
        عربي
      </button>
    </div>
  );
}
