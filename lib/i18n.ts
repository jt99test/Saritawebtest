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

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}
