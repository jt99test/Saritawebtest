"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { dictionaries } from "@/lib/i18n";

const COOKIE_CONSENT_KEY = "sarita_cookie_consent";

export function CookieBanner() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(COOKIE_CONSENT_KEY));
  }, []);

  function saveConsent(value: "accepted" | "declined") {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-cosmic-950/96 px-4 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-[#3a3048] sm:flex-row sm:items-center sm:justify-between">
        <p>
          {dictionary.legal.cookieMessage}{" "}
          <Link href="/privacidad" className="text-[#5c4a24] underline underline-offset-4">
            {dictionary.legal.cookiePrivacy}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => saveConsent("declined")}
            className="border border-black/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:border-black/15 hover:text-ivory"
          >
            {dictionary.legal.cookieDecline}
          </button>
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="border border-dusty-gold/35 bg-dusty-gold/12 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-dusty-gold transition hover:bg-dusty-gold/18"
          >
            {dictionary.legal.cookieAccept}
          </button>
        </div>
      </div>
    </div>
  );
}
