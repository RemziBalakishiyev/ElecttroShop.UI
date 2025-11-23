import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationAZ from './locales/az/translation.json';

const resources = {
  az: {
    translation: translationAZ,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'az', // default language
    fallbackLng: 'az',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
