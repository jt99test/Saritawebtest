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

      <section className="relative isolate min-h-screen overflow-hidden">
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,7,13,0.68),rgba(5,7,13,0.34)_42%,rgba(5,7,13,0.82)),linear-gradient(180deg,rgba(5,7,13,0.24),rgba(5,7,13,0.78)_76%,#05070d)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[34vh] bg-gradient-to-t from-cosmic-950 via-cosmic-950/72 to-transparent" />

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

            <div className="ml-auto flex items-center gap-4">
              <AccountButton />
              <LanguageSelector
                dictionary={dictionary}
                locale={locale}
                onChange={handleLocaleChange}
              />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center pt-8 sm:pt-10">
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
              className="max-w-[9ch] text-6xl leading-[0.9] font-medium text-white drop-shadow-[0_18px_34px_rgba(0,0,0,0.58)] sm:text-8xl lg:text-[8rem]"
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.12, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {dictionary.brand.name}
            </motion.h1>

            <motion.p
              className="max-w-xl text-balance text-[0.95rem] leading-7 text-ivory/76 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:text-base"
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
                className="min-w-56 px-8 py-3.5 text-[0.8rem] uppercase tracking-[0.18em]"
              >
                {dictionary.home.cta}
              </PrimaryButton>
            </motion.div>
            </motion.div>
          </div>

          <div className="relative z-10 border-t border-white/10 py-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="group block border-l border-white/10 px-4 py-2 text-left transition hover:border-dusty-gold/45 hover:bg-white/[0.025]"
                >
                  <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ivory/58 transition group-hover:text-dusty-gold/82">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ivory/42 transition group-hover:text-ivory/66">
                    {feature.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
