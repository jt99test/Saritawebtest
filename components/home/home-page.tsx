"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { AccountButton } from "@/components/auth/account-button";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { setStoredLocale, useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { illustrations } from "@/data/illustrations";
import { dictionaries, type Locale } from "@/lib/i18n";

export function HomePage() {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const features = dictionary.home.features;

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  function handleLocaleChange(nextLocale: Locale) {
    setStoredLocale(nextLocale);
  }

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <AtmosphericBackground variant="hero" />
        <AtmosphericBackground variant="heroGlow" />

        <Image
          src={illustrations.scenes.landing}
          alt=""
          fill
          priority
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-60 saturate-[0.82]"
          style={{ objectPosition: "70% center" }}
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_42%,rgba(0,0,0,0.04)),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_76%,#f5f0e6)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34vh] bg-gradient-to-t from-cosmic-950 via-cosmic-950/72 to-transparent" />

        <Container className="relative flex min-h-[100svh] flex-col pb-5 pt-4 sm:min-h-screen sm:pb-10 sm:pt-6">
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-black/12 bg-[#fffaf0]/78 px-3 py-2.5 shadow-[0_14px_40px_rgba(30,26,46,0.12)] backdrop-blur-md sm:gap-6 sm:rounded-full sm:px-5 sm:py-3">
            <div className="min-w-0 flex-1 pt-2">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden h-px w-10 shrink-0 bg-gradient-to-r from-dusty-gold to-transparent min-[420px]:block sm:w-14" />
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24] sm:text-[12px] sm:tracking-[0.32em]">
                  {dictionary.home.eyebrow}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3 sm:gap-4">
              <Link
                href="/precios"
                className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-[#1e1a2e] transition hover:text-[#5c4a24] sm:inline"
              >
                {dictionary.nav.pricing}
              </Link>
              <AccountButton />
              <LanguageSelector
                dictionary={dictionary}
                locale={locale}
                onChange={handleLocaleChange}
              />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center pt-6 sm:pt-10">
            <motion.div
              className="flex w-full max-w-[34rem] flex-col items-start gap-5 text-left sm:gap-6"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: {} }}
            >
            <motion.div
              className="h-px w-20 bg-gradient-to-r from-dusty-gold/70 to-transparent sm:w-28"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            />
            <motion.h1
              className="max-w-[9ch] text-[3.35rem] leading-[0.92] font-medium text-ivory drop-shadow-[0_18px_34px_rgba(0,0,0,0.58)] sm:text-8xl lg:text-[8rem]"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.12, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {dictionary.brand.name}
            </motion.h1>

            <motion.p
              className="max-w-xl text-balance text-[0.9rem] leading-6 text-ivory/76 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:text-base sm:leading-7"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.26, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {dictionary.home.subtitle}
            </motion.p>

            <motion.div
              className="pt-1"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.42, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PrimaryButton
                href="/form"
                className="min-w-0 px-7 py-3.5 text-[0.72rem] uppercase tracking-[0.16em] sm:min-w-56 sm:px-8 sm:py-4 sm:text-[0.8rem] sm:tracking-[0.18em]"
              >
                {dictionary.home.cta}
              </PrimaryButton>
            </motion.div>
            </motion.div>
          </div>

          <div className="relative z-10 border-t border-black/10 py-3 sm:py-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {features.map((feature, index) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group block border-l border-black/10 px-3 py-2 text-left transition hover:border-dusty-gold/45 hover:bg-white sm:px-4"
                >
                  <span className="mb-2 block text-xl text-[#5c4a24] sm:mb-3 sm:text-2xl">
                    {["☽", "☉", "♄", "♁"][index] ?? "☽"}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase leading-4 tracking-[0.16em] text-[#3a3048] transition group-hover:text-[#5c4a24] sm:text-[12px] sm:tracking-[0.24em]">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-4 text-[#3a3048] transition group-hover:text-[#3a3048] sm:text-xs sm:leading-5">
                    {feature.description}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-[#3a3048] sm:mt-5 sm:gap-x-5 sm:text-[12px] sm:tracking-[0.18em]">
              <Link href="/precios" className="transition hover:text-dusty-gold">{dictionary.nav.pricing}</Link>
              <Link href="/ayuda" className="transition hover:text-dusty-gold">{dictionary.nav.help}</Link>
              <Link href="/privacidad" className="transition hover:text-dusty-gold">{dictionary.legal.privacy}</Link>
              <Link href="/terminos" className="transition hover:text-dusty-gold">{dictionary.legal.terms}</Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
