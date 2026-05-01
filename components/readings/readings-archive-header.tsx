"use client";

import Link from "next/link";

import { AccountButton } from "@/components/auth/account-button";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { dictionaries } from "@/lib/i18n";

export function ReadingsArchiveHeader() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];

  return (
    <>
      <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between gap-4 border-b border-black/10 pb-4">
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory"
        >
          {dictionary.readings.back}
        </Link>
        <AccountButton />
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#6f613a]">
              {dictionary.readings.eyebrow}
            </p>
            <h1 className="font-serif text-[48px] font-normal leading-none text-ivory">
              {dictionary.readings.title}
            </h1>
          </div>
          <PrimaryButton
            href="/form"
            variant="ghostGold"
            className="px-5 py-3 text-[12px] uppercase tracking-[0.2em] sm:min-w-[210px]"
          >
            {dictionary.readings.newReading}
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}
