import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Initialize i18n
// - Use HttpApi for dynamic loading
// - Use LanguageDetector for robust detection
// - Set debug: true for troubleshooting
// - Ensure resources are reloaded on language change

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem('sehatynet-language') || undefined, // let detector handle if not set
    fallbackLng: 'en',
    debug: true,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

// Ensure resources are reloaded on language change
// (React-i18next will do this automatically, but you can force it if needed)
i18n.on('languageChanged', (lng) => {
  i18n.reloadResources(lng);
});

export default i18n; 