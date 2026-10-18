import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/common.json';
import ar from './locales/ar/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Apply document direction and language code based on current language
export function applyHtmlDirection(lng) {
  if (typeof document === 'undefined') return;
  const isRtl = lng === 'ar';
  document.documentElement.lang = lng;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
}

// Initial sync
applyHtmlDirection(i18n.language ? i18n.language.split('-')[0] : 'en');

// Sync on language change
i18n.on('languageChanged', (lng) => {
  applyHtmlDirection(lng ? lng.split('-')[0] : 'en');
});

export default i18n;
