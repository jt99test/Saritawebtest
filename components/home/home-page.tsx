"use client";

import { useEffect, useState } from "react";

import { CelestialLayer } from "@/components/celestial/celestial-layer";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { defaultLocale, dictionaries, type Locale } from "@/lib/i18n";

export function HomePage() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const dictionary = dictionaries[locale];

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative min-h-screen overflow-hidden">
        <CelestialLayer />
        <AtmosphericBackground variant="hero" />
        <AtmosphericBackground variant="heroGlow" />

        <Container className="relative flex min-h-screen flex-col pb-8 pt-5 sm:pb-10 sm:pt-6">
          <div className="flex items-start justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1 pt-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-px w-10 shrink-0 bg-gradient-to-r from-dusty-gold/70 to-transparent sm:w-14" />
                <p className="truncate text-[0.56rem] uppercase tracking-[0.28em] text-dusty-gold/80 sm:text-[0.68rem] sm:tracking-[0.38em]">
                {dictionary.home.eyebrow}
                </p>
              </div>
            </div>

            <div className="ml-auto">
              <LanguageSelector
                dictionary={dictionary}
                locale={locale}
                onChange={setLocale}
              />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-end pb-[15vh] text-center sm:pb-[13vh]">
            <div className="mb-5 h-px w-20 bg-gradient-to-r from-transparent via-dusty-gold/70 to-transparent sm:mb-7 sm:w-28" />

            <h1 className="max-w-[10ch] text-[clamp(5.75rem,14vw,15rem)] leading-[0.88] font-medium tracking-[-0.055em] text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
              {dictionary.brand.name}
            </h1>

            <p className="mt-4 max-w-sm text-balance text-[0.92rem] leading-7 text-dusty-gold/82 sm:mt-5 sm:text-[1.02rem]">
              {dictionary.home.subtitle}
            </p>

            <div className="mt-8 sm:mt-10">
              <PrimaryButton
                href="/form"
                variant="ghostGold"
                className="min-w-56 px-8 py-3.5 text-[0.8rem] tracking-[0.18em] uppercase"
              >
                {dictionary.home.cta}
              </PrimaryButton>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cosmic-950 via-cosmic-950/55 to-transparent" />
        </Container>
      </section>
    </main>
  );
}
