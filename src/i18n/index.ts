import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = '@cynasecure/lang';

async function detectLang() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  const device = Localization.getLocales()?.[0]?.languageCode ?? 'fr';
  if (device === 'en') return 'en';
  if (device === 'es') return 'es';
  return 'fr';
}

export async function initI18n() {
  const lng = await detectLang();
  await i18n.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
    },
    lng,
    fallbackLng: 'fr',
    compatibilityJSON: 'v3',
    interpolation: { escapeValue: false },
  });
}

export async function changeLang(lng: 'fr' | 'en' | 'es') {
  await AsyncStorage.setItem(STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

export default i18n;
