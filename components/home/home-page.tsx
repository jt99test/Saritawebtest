"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { User } from "@supabase/supabase-js";

import { AccountButton } from "@/components/auth/account-button";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { setStoredLocale, useStoredLocale } from "@/components/i18n/use-stored-locale";
import { Container } from "@/components/ui/container";
import { showNotice } from "@/components/ui/notice-provider";
import { PrimaryButton } from "@/components/ui/primary-button";
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

  const mobileFeaturedItems = showAllFeatures ? features : features.slice(0, 3);
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
    <main className="sarita-home-atmosphere premium-noise relative isolate min-h-screen overflow-hidden sm:pb-0">
      <section className="relative isolate min-h-screen overflow-hidden">
        <div className="sarita-solar-system pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="sarita-starfield absolute inset-0" />
          <div className="sarita-meteor-field absolute inset-0">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="sarita-bright-starfield absolute inset-0">
            <span />
            <span />
            <span />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(255,250,240,0.08),transparent_22rem),radial-gradient(circle_at_74%_48%,rgba(80,93,196,0.18),transparent_18rem)]" />
          <div className="absolute left-1/2 top-[23%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#fff4b0,#f5d782_44%,rgba(245,215,130,0.16)_68%,transparent_72%)] shadow-[0_0_50px_rgba(245,215,130,0.42),0_0_120px_rgba(0,102,255,0.18)] sm:h-28 sm:w-28" />
          <div className="sarita-solar-orbit h-[15rem] w-[15rem] sm:h-[23rem] sm:w-[23rem]">
            <span className="sarita-solar-planet right-7 top-4 h-2.5 w-2.5 bg-[#fffaf0] text-[#fffaf0]" />
          </div>
          <div className="sarita-solar-orbit h-[23rem] w-[23rem] sm:h-[34rem] sm:w-[34rem]">
            <span className="sarita-solar-planet bottom-10 left-12 h-3.5 w-3.5 bg-[#f5d782] text-[#f5d782]" />
          </div>
          <div className="sarita-solar-orbit h-[32rem] w-[32rem] sm:h-[48rem] sm:w-[48rem]">
            <span className="sarita-solar-planet right-16 top-20 h-5 w-5 bg-[#7cbfff] text-[#7cbfff]" />
          </div>
          <div className="sarita-solar-orbit h-[42rem] w-[42rem] sm:h-[62rem] sm:w-[62rem]">
            <span className="sarita-solar-planet bottom-28 right-24 h-3 w-3 bg-[#0066ff] text-[#0066ff]" />
          </div>
        </div>
        <Container className="relative z-10 flex min-h-screen flex-col px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pb-10 sm:pt-6">
          <div className="sarita-mobile-constellation-header flex items-center justify-between sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="sarita-floating-mark flex h-11 w-11 items-center justify-center rounded-full font-serif text-[1.7rem] text-[#fffaf0]"
              aria-label="Menu"
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="sarita-night-pill ml-auto mr-1 flex h-11 w-11 items-center justify-center rounded-full text-lg"
              aria-label={dictionary.common.account}
            >
              ♙
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-[1200] bg-black/35 backdrop-blur-sm sm:hidden" onClick={() => setMobileMenuOpen(false)}>
              <div
                className="sarita-menu-panel absolute inset-x-3 top-4 p-5"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f5d782]">{dictionary.brand.name}</p>
                    <p className="mt-2 font-serif text-2xl text-[#fffaf0]">{dictionary.home.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 text-xl text-[#f5d782]"
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
                      className="sarita-tab-inactive border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-5 border-t border-black/10 pt-4">
                  {user ? (
                    <div className="grid gap-2">
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]">
                        {dictionary.common.account}
                      </p>
                      <Link
                        href="/cuenta"
                        onClick={() => setMobileMenuOpen(false)}
                        className="sarita-tab-inactive border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition"
                      >
                        {dictionary.nav.account}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        disabled={signingOut}
                        className="sarita-tab-inactive w-full border px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.18em] transition disabled:cursor-wait disabled:opacity-50"
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

          <div className="sarita-night-nav mx-auto hidden w-full max-w-[75rem] grid-cols-[1fr_auto_1fr] items-center gap-5 rounded-full px-6 py-3.5 backdrop-blur-md sm:grid">
            <Link href="/" className="flex min-w-0 items-center gap-4 justify-self-start">
              <span className="sarita-floating-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-[1.45rem] leading-none text-[#fffaf0]">
                S
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f5d782]">
                  {dictionary.home.eyebrow}
                </span>
                <span className="mt-1 block truncate font-serif text-lg leading-none text-[#fffaf0]">
                  {dictionary.brand.name}
                </span>
              </span>
            </Link>

            <div className="hidden items-center justify-center gap-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#fffaf0]/74 lg:flex">
              <Link href="/form" className="transition hover:text-[#f5d782]">
                {dictionary.common.newReading}
              </Link>
              <Link href="#lecturas" className="transition hover:text-[#f5d782]">
                {dictionary.common.viewReadings}
              </Link>
              <Link href="/precios" className="transition hover:text-[#f5d782]">
                {dictionary.nav.pricing}
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-3 justify-self-end sm:gap-4">
              <AccountButton tone="night" />
              <LanguageSelector
                dictionary={dictionary}
                locale={locale}
                onChange={handleLocaleChange}
                tone="night"
              />
            </div>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6.5rem)] w-full max-w-5xl items-center justify-center pb-40 pt-8 text-center sm:min-h-[calc(100svh-10.5rem)] sm:pb-32 sm:pt-8">
            <motion.div
              className="mx-auto flex w-full max-w-[42rem] flex-col items-center gap-4 sm:gap-6"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: {} }}
            >
              <motion.div
                className="h-px w-24 bg-gradient-to-r from-transparent via-dusty-gold/70 to-transparent sm:w-32"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              />
              <motion.h1
                className="sarita-sheen text-[4rem] leading-[0.88] font-medium text-[#fffaf0] drop-shadow-[0_18px_42px_rgba(0,0,0,0.64)] sm:text-8xl lg:text-[9rem]"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.12, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {dictionary.brand.name}
              </motion.h1>

              <motion.p
                className="max-w-[30rem] text-balance text-[1rem] leading-[1.7] text-[#fffaf0]/78 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] sm:text-base sm:leading-7"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ delay: 0.26, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {dictionary.home.subtitle}
              </motion.p>

              <motion.a
                href="#empieza"
                className="absolute bottom-24 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#fffaf0]/58 sm:bottom-20"
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

            <motion.div
              className="absolute inset-x-0 bottom-8 z-20 flex justify-center sm:bottom-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PrimaryButton
                href="/form"
                className="min-h-14 min-w-0 px-9 py-4 text-[0.78rem] uppercase tracking-[0.18em] shadow-[0_18px_44px_rgba(245,215,130,0.22),0_18px_42px_rgba(0,0,0,0.28)] sm:min-w-64 sm:px-10 sm:py-4 sm:text-[0.8rem]"
              >
                {dictionary.home.cta}
              </PrimaryButton>
            </motion.div>
          </div>

          <div id="empieza" className="relative z-10 -mx-4 mt-6 px-4 pt-8 pb-3 sm:mx-0 sm:mt-0 sm:px-0 sm:py-4">
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
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d782]">
                      {moonPhaseLabel} en {moonSignLabel}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#f5d782]/35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,250,240,0.18),rgba(245,215,130,0.12),rgba(7,20,55,0.68))] font-serif text-2xl text-[#f5d782] shadow-[0_0_24px_rgba(0,102,255,0.18)]">
                    ☾
                  </div>
                </div>
                <p className="mt-4 text-[13px] leading-[1.75] text-[#fffaf0]/74">{moonPhaseDescription}</p>
              </motion.section>

              <motion.section
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
                        className="grid grid-cols-[2.5rem_1fr] gap-x-3 rounded-[1.6rem] border border-[#f5d782]/32 bg-[#071437]/44 px-4 py-4 shadow-[0_0_28px_rgba(0,102,255,0.12),0_8px_22px_rgba(0,0,0,0.18)] transition hover:border-[#f5d782]/60 hover:bg-[#0a1f58]/54"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f5d782]/48 bg-[radial-gradient(circle_at_32%_24%,#fff7bf,rgba(245,215,130,0.82)_52%,rgba(5,19,49,0.4))] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#030814] shadow-[0_0_20px_rgba(245,215,130,0.2)]">
                          0{index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0]/78">{item.title}</span>
                          <span className="mt-2 block text-[13px] leading-[1.65] text-[#fffaf0]/64">{item.description}</span>
                          <span className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f5d782]">{item.cta}</span>
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>

            <div id="lecturas" className="sarita-feature-band -mx-4 mt-0 px-4 pt-12 pb-2 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-[76rem] sm:px-0 sm:pt-2 sm:pb-8">
              <div className="mb-4 flex items-end justify-between sm:hidden">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]">{dictionary.home.eyebrow}</p>
                  <h2 className="mt-2 font-serif text-[1.9rem] leading-[1.05] text-[#fffaf0] drop-shadow-[0_0_24px_rgba(0,102,255,0.2)]">{dictionary.home.featuredTitle}</h2>
                </div>
              </div>
              <div className="mb-8 hidden text-center sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#f5d782]">{dictionary.home.eyebrow}</p>
                <h2 className="mt-2 font-serif text-4xl leading-none text-[#fffaf0] drop-shadow-[0_0_24px_rgba(0,102,255,0.2)] lg:text-5xl">
                  {dictionary.home.featuredTitle}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:hidden">
                {mobileFeaturedItems.map((feature, index) => (
                  <motion.div
                    key={`${feature.href}-${index}`}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ ...revealTransition, delay: 0.05 * index }}
                  >
                    <Link
                      href={feature.href}
                      className="sarita-feature-card group grid min-h-16 min-w-0 grid-cols-[2.5rem_1fr] items-center gap-x-3 overflow-hidden rounded-[1.45rem] px-4 py-4 text-left backdrop-blur-sm transition"
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dusty-gold/55 to-transparent" />
                      <span className="sarita-feature-icon flex h-10 w-10 items-center justify-center rounded-full text-[1.35rem] leading-none text-[#030814]">
                        {FEATURE_SYMBOLS[index] ?? "\u263d"}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase leading-4 tracking-[0.14em] text-[#fffaf0] transition group-hover:text-[#f5d782] [overflow-wrap:normal] [word-break:normal]">
                          {featureTitle(feature.title)}
                        </span>
                        <span className="mt-1.5 block text-[12px] leading-[1.55] text-[#d7e7ff]/72 transition group-hover:text-[#fffaf0]/84">
                          {feature.description}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                  ))}
                </div>
              <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                {features.map((feature, index) => (
                  <motion.div
                    key={`${feature.href}-${index}`}
                    className="h-full min-w-0"
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ ...revealTransition, delay: 0.04 * index }}
                  >
                    <Link
                      href={feature.href}
                      className="sarita-feature-card group relative grid h-full min-h-[11rem] min-w-0 grid-rows-[auto_1fr] overflow-hidden rounded-[1.2rem] px-4 py-5 text-center backdrop-blur-sm transition lg:min-h-[11.75rem]"
                    >
                      <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-dusty-gold/55 to-transparent" />
                      <span className="sarita-feature-icon mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[1.65rem] leading-none text-[#030814]">
                        {FEATURE_SYMBOLS[index] ?? "\u263d"}
                      </span>
                      <span className="mt-4 flex min-w-0 flex-col items-center">
                        <span className="block max-w-full text-[11px] font-semibold uppercase leading-4 tracking-[0.13em] text-[#fffaf0] transition group-hover:text-[#f5d782]">
                          {featureTitle(feature.title)}
                        </span>
                        <span className="mt-2.5 block text-xs leading-5 text-[#d7e7ff]/72 transition group-hover:text-[#fffaf0]/84">
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
                  className="border border-[#f5d782]/50 bg-[#071437]/54 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5d782] shadow-[0_0_24px_rgba(0,102,255,0.12)]"
                >
                  {showAllFeatures ? lessReadingsLabel : moreReadingsLabel}
                </button>
              </div>
            </div>

            <div className="mt-20 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-[#fffaf0]/62 sm:mt-5 sm:gap-x-5 sm:text-[12px] sm:tracking-[0.18em]">
              <span className="basis-full text-center text-[10px] tracking-[0.18em] text-[#f5d782] sm:hidden">© 2026 SARITA</span>
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
