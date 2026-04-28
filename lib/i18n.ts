import en from "@/locales/en.json";
import es from "@/locales/es.json";
import it from "@/locales/it.json";

export const dictionaries = {
  es,
  en,
  it,
} as const;

export type Locale = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Locale];

export const defaultLocale: Locale = "es";
export const localeOptions: Locale[] = ["es", "en", "it"];
export const LOCALE_STORAGE_KEY = "sarita_locale";

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return localeOptions.includes(value as Locale);
}
