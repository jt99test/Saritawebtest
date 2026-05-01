"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { dictionaries } from "@/lib/i18n";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <Container className="relative flex min-h-screen items-center justify-center py-10">
        <section className="max-w-2xl border border-black/10 bg-white px-6 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:px-10">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#6f613a]">
            {dictionary.brand.name}
          </p>
          <h1 className="mt-3 font-serif text-[42px] leading-tight text-ivory sm:text-[58px]">
            {dictionary.standalonePages.errorTitle}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#3a3048]">
            {dictionary.standalonePages.errorBody}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="rounded-full border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#6f613a] transition hover:border-dusty-gold/60 hover:bg-dusty-gold/18"
            >
              {dictionary.common.tryAgain}
            </button>
            <Link
              href="/"
              className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#3a3048] transition hover:text-ivory"
            >
              {dictionary.result.back}
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
