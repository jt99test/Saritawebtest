"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { User } from "@supabase/supabase-js";

import { AccountButton } from "@/components/auth/account-button";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { setStoredLocale, useStoredLocale } from "@/components/i18n/use-stored-locale";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { showNotice } from "@/components/ui/notice-provider";
import { PrimaryButton } from "@/components/ui/primary-button";
import { illustrations } from "@/data/illustrations";
import { getSignLabel } from "@/lib/chart-labels";
import { clearChartSession } from "@/lib/chart-session";
import { dictionaries, type Locale } from "@/lib/i18n";
import type { CurrentMoonStatus } from "@/lib/lunar.server";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type HomePageProps = {
  moonStatus: CurrentMoonStatus;
};

const FEATURE_SYMBOLS = ["\u263d", "\u2609", "\u2644", "\u260c", "\u2609", "\u26ad", "\u2641"] as const;

export function HomePage({ moonStatus }: HomePageProps) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const features = dictionary.home.features;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function handleLocaleChange(nextLocale: Locale) {
    setStoredLocale(nextLocale);
  }

  async function signOut() {
    setSigningOut(true);
    showNotice({ message: dictionary.auth.signingOut, tone: "info" });
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);

    if (error) {
      console.error("Sign out failed:", error.message);
      showNotice({ message: error.message, tone: "error" });
      return;
    }

    clearChartSession();
    setUser(null);
    setMobileMenuOpen(false);
    showNotice({ message: dictionary.auth.signedOut, tone: "success" });
    window.location.assign("/");
  }

  function featureTitle(title: string) {
    return title.replace(/astrocartography|astrocartograf[ií]a|astrocartografia/i, (match) => {
      if (/astrocartography/i.test(match)) return "Astro cartography";
      if (/astrocartograf[ií]a/i.test(match)) return "Astro cartografía";
      return "Astro cartografia";
    });
  }

  const featuredItems = showAllFeatures ? features : features.slice(0, 3);
  const moonCopy = dictionary.home.currentMoon;
  const startHereCopy = dictionary.home.startHere;
  const moonPhaseLabel = moonCopy.phases[moonStatus.phase];
  const moonPhaseDescription = moonCopy.descriptions[moonStatus.phase];
  const moonSignLabel = getSignLabel(moonStatus.sign, locale);
  const moreReadingsLabel =
    locale === "en" ? "View all readings" : locale === "it" ? "Vedi tutte le letture" : "Ver todas las lecturas";
  const lessReadingsLabel =
    locale === "en" ? "Show less" : locale === "it" ? "Mostra meno" : "Ver menos";
  const mobileMenuLinks = [
    { href: "/form", label: dictionary.common.newReading },
    { href: "/lecturas", label: dictionary.common.viewReadings },
    { href: "/cuenta", label: dictionary.nav.account },
    { href: "/precios", label: dictionary.nav.pricing },
    { href: "/ayuda", label: dictionary.nav.help },
  ];
  const revealTransition = { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950 sm:pb-0">
      <AtmosphericBackground variant="page" />

      <section className="relative isolate min-h-[86svh] overflow-hidden sm:min-h-screen">
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
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_42%,rgba(0,0,0,0.04)),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.04)_72%,#f5f0e6)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[46svh] bottom-0 -z-10 bg-gradient-to-b from-transparent via-[#f5f0e6]/70 to-[#f5f0e6]/92 sm:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-[34vh] bg-gradient-to-t from-cosmic-950 via-cosmic-950/72 to-transparent sm:block" />

        <Container className="relative flex min-h-[86svh] flex-col px-4 pb-5 pt-4 sm:min-h-screen sm:pb-10 sm:pt-6">
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#fffaf0]/16 px-3 py-2.5 text-ivory shadow-[0_12px_34px_rgba(0,0,0,0.18)] backdrop-blur-md sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center font-serif text-2xl text-ivory"
              aria-label="Menu"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="ml-auto flex h-10 w-10 translate-x-2 items-center justify-center rounded-full border border-white/18 bg-white/10 text-lg text-ivory"
              aria-label={dictionary.common.account}
            >
              ♙
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-[1200] bg-black/35 backdrop-blur-sm sm:hidden" onClick={() => setMobileMenuOpen(false)}>
              <div
                className="absolute inset-x-3 top-4 border border-dusty-gold/26 bg-[#f8f4eb] p-5 text-[#1e1a2e] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8a7a4e]">{dictionary.brand.name}</p>
                    <p className="mt-2 font-serif text-2xl text-[#1e1a2e]">{dictionary.home.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 text-xl text-[#8a7a4e]"
                    aria-label={dictionary.common.close}
                  >
                    ×
                  </button>
                </div>
                <div className="mt-5 grid gap-2">
                  {mobileMenuLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="border border-black/10 bg-white/52 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:border-dusty-gold/40 hover:text-[#5c4a24]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-5 border-t border-black/10 pt-4">
                  {user ? (
                    <div className="grid gap-2">
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
                        {dictionary.common.account}
                      </p>
                      <Link
                        href="/cuenta"
                        onClick={() => setMobileMenuOpen(false)}
                        className="border border-black/10 bg-white/52 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:border-dusty-gold/40 hover:text-[#5c4a24]"
                      >
                        {dictionary.nav.account}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        disabled={signingOut}
                        className="w-full border border-black/10 bg-white/52 px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-[#3a3048] transition hover:border-dusty-gold/40 hover:text-[#5c4a24] disabled:cursor-wait disabled:opacity-50"
                      >
                        {signingOut ? dictionary.auth.processing : dictionary.common.signOut}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4">
                  <LanguageSelector dictionary={dictionary} locale={locale} onChange={handleLocaleChange} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="hidden items-center justify-between gap-3 rounded-[1.4rem] border border-black/12 bg-[#fffaf0]/78 px-3 py-2.5 shadow-[0_14px_40px_rgba(30,26,46,0.12)] backdrop-blur-md sm:flex sm:gap-6 sm:rounded-full sm:px-5 sm:py-3">
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

          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 items-center pt-5 sm:pt-10">
            <motion.div
              className="flex w-full max-w-[34rem] flex-col items-start gap-4 text-left sm:gap-6"
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
                className="sarita-sheen max-w-[9ch] text-[3.2rem] leading-[0.92] font-medium text-ivory drop-shadow-[0_18px_34px_rgba(0,0,0,0.58)] sm:text-8xl lg:text-[8rem]"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.12, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {dictionary.brand.name}
              </motion.h1>

              <motion.p
                className="max-w-[30rem] text-balance text-[0.98rem] leading-[1.7] text-ivory/84 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:text-base sm:leading-7"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.26, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {dictionary.home.subtitle}
              </motion.p>

              <motion.div
                className="pt-6 pb-8 sm:py-1"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.42, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <PrimaryButton
                  href="/form"
                  className="min-h-14 min-w-0 px-8 py-4 text-[0.78rem] uppercase tracking-[0.18em] shadow-[0_18px_40px_rgba(255,255,255,0.14),0_18px_42px_rgba(0,0,0,0.22)] sm:min-w-56 sm:px-8 sm:py-4 sm:text-[0.8rem] sm:tracking-[0.18em]"
                >
                  {dictionary.home.cta}
                </PrimaryButton>
              </motion.div>
              <motion.a
                href="#empieza"
                className="pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/70 sm:hidden"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.56, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                animate={{ y: [0, 4, 0] }}
              >
                {dictionary.home.scrollCue} ↓
              </motion.a>
            </motion.div>
          </div>

          <div className="relative z-10 border-t border-black/10 pt-8 pb-3 sm:py-4">
            <div className="space-y-4 sm:hidden">
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={revealTransition}
                className="sarita-glass-panel overflow-hidden rounded-[2rem] px-5 py-5 backdrop-blur-sm"
              >
                <div className="mb-4 h-px w-16 bg-gradient-to-r from-dusty-gold/70 to-transparent" />
                <p className="sarita-section-label">{moonCopy.eyebrow}</p>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-[1.9rem] leading-[1.02] text-[#fffaf0]">{moonCopy.title}</h2>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7bd6a]">
                      {moonPhaseLabel} en {moonSignLabel}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d7bd6a]/35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,250,240,0.18),rgba(215,189,106,0.12),rgba(7,7,19,0.68))] font-serif text-2xl text-[#d7bd6a] shadow-[0_0_24px_rgba(122,75,255,0.18)]">
                    ☾
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-[1.75] text-[#fffaf0]/74">{moonPhaseDescription}</p>
              </motion.section>

              <motion.section
                id="empieza"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: 0.06 }}
                className="sarita-glass-panel overflow-hidden rounded-[2rem] px-5 py-5 backdrop-blur-sm"
              >
                <div className="mb-4 h-px w-16 bg-gradient-to-r from-dusty-gold/70 to-transparent" />
                <p className="sarita-section-label">{startHereCopy.eyebrow}</p>
                <h2 className="mt-3 max-w-[12ch] font-serif text-[1.9rem] leading-[1.05] text-[#fffaf0]">{startHereCopy.title}</h2>
                <div className="mt-5 grid gap-3">
                  {startHereCopy.items.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ ...revealTransition, delay: 0.08 * index }}
                    >
                      <Link
                        href={item.href}
                        className="grid grid-cols-[2.5rem_1fr] gap-x-3 rounded-[1.6rem] border border-[#d7d0ff]/14 bg-[#070713]/28 px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.14)] transition hover:border-[#d7bd6a]/40 hover:bg-[#fffaf0]/8"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dusty-gold/30 bg-white/58 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c4a24]">
                          0{index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0]/78">{item.title}</span>
                          <span className="mt-2 block text-[13px] leading-[1.65] text-[#fffaf0]/64">{item.description}</span>
                          <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d7bd6a]">{item.cta}</span>
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>

            <div id="lecturas" className="mt-8 sm:mt-0">
              <div className="mb-4 flex items-end justify-between sm:hidden">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">{dictionary.home.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-[1.9rem] leading-[1.05] text-[#1e1a2e]">{dictionary.home.featuredTitle}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4 2xl:grid-cols-7">
                {featuredItems.map((feature, index) => (
                  <motion.div
                    key={feature.href}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ ...revealTransition, delay: 0.05 * index }}
                  >
                    <Link
                      href={feature.href}
                      className="group grid min-h-16 min-w-0 grid-cols-[2.5rem_1fr] items-center gap-x-3 overflow-hidden rounded-[1.7rem] border border-black/16 bg-[linear-gradient(180deg,rgba(255,250,240,0.84),rgba(255,250,240,0.72))] px-4 py-4 text-left shadow-[0_16px_38px_rgba(30,26,46,0.17)] backdrop-blur-sm transition hover:border-dusty-gold/45 hover:bg-white sm:block sm:min-h-0 sm:border-l sm:border-t-0 sm:border-r-0 sm:border-b-0 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2 sm:shadow-none sm:backdrop-blur-0"
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dusty-gold/55 to-transparent sm:hidden" />
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dusty-gold/25 bg-white/54 text-[1.35rem] leading-none text-[#5c4a24] sm:mb-3 sm:h-auto sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:text-2xl">
                        {FEATURE_SYMBOLS[features.indexOf(feature)] ?? "\u263d"}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-[#3a3048] transition group-hover:text-[#5c4a24] [overflow-wrap:normal] [word-break:normal] sm:text-[12px] sm:tracking-[0.18em] xl:tracking-[0.24em]">
                          {featureTitle(feature.title)}
                        </span>
                        <span className="mt-1.5 block text-[12px] leading-[1.55] text-[#342b43] transition group-hover:text-[#342b43] sm:text-xs sm:leading-5">
                          {feature.description}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 text-center sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowAllFeatures((current) => !current)}
                  className="border border-black/10 bg-[#fffaf0]/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5c4a24]"
                >
                  {showAllFeatures ? lessReadingsLabel : moreReadingsLabel}
                </button>
              </div>
            </div>

            <div className="mt-20 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-[#3a3048] sm:mt-5 sm:gap-x-5 sm:text-[12px] sm:tracking-[0.18em]">
              <span className="basis-full text-center text-[10px] tracking-[0.18em] text-[#8a7a4e] sm:hidden">© 2026 SARITA</span>
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
