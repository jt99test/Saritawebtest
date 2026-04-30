"use client";

import { useSyncExternalStore } from "react";

import { defaultLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

const LOCALE_CHANGE_EVENT = "sarita:locale-change";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return storedLocale && isLocale(storedLocale) ? storedLocale : defaultLocale;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onStoreChange);
  };
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

export function useStoredLocale() {
  return useSyncExternalStore(subscribe, getStoredLocale, () => defaultLocale);
}
