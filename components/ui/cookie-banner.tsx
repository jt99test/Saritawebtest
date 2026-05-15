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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#f5d782]/22 bg-[#071437]/96 px-4 py-4 shadow-[0_-18px_54px_rgba(0,0,0,0.28)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 text-sm text-[#d7e7ff]/72 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {dictionary.legal.cookieMessage}{" "}
          <Link href="/privacidad" className="text-[#f5d782] underline underline-offset-4">
            {dictionary.legal.cookiePrivacy}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => saveConsent("declined")}
            className="border border-[#d7e7ff]/18 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d7e7ff] transition hover:border-[#f5d782]/45 hover:text-[#f5d782]"
          >
            {dictionary.legal.cookieDecline}
          </button>
          <button
            type="button"
            onClick={() => saveConsent("accepted")}
            className="border border-[#f5d782]/40 bg-[#f5d782]/12 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#f5d782] transition hover:bg-[#f5d782]/18"
          >
            {dictionary.legal.cookieAccept}
          </button>
        </div>
      </div>
    </div>
  );
}
