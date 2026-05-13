"use client";

import { useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";

import type { Dictionary, Locale } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";

import { AspectDetailPanel } from "@/components/chart/aspect-detail-panel";
import { AstrocartographyPage } from "@/components/chart/astrocartography-page";
import { ChartBalanceSection } from "@/components/chart/chart-balance-section";
import { ChartCompletePage } from "@/components/chart/chart-complete-page";
import { ChartGeneralReading } from "@/components/chart/chart-general-reading";
import { ChartShareActions } from "@/components/chart/chart-share-actions";
import { ReadingUsageBanner } from "@/components/chart/reading-usage-banner";
import { useChartStore } from "@/components/chart/chart-store";
import { ChartLayerRail, NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import { PlanetDetailPanel } from "@/components/chart/planet-detail-panel";
import { PrimaryButton } from "@/components/ui/primary-button";
import { PricingModal } from "@/components/paywall/pricing-modal";
import { SolarReturnPage } from "@/components/chart/solar-return-page";
import { SynastryPage } from "@/components/chart/synastry-page";
import { LunaDelMesPage } from "@/components/lunar/luna-del-mes-page";
import { YogaAstralPage } from "@/components/yoga/yoga-astral-page";
import { usePlan } from "@/lib/use-plan";
import type { PaidPlan } from "@/lib/stripe";

type NatalChartExperienceProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  locale: Locale;
  isMock?: boolean;
  request?: FormValues | null;
  readingId?: string;
};

type PageTabId = "natal" | "moon" | "yoga" | "complete" | "solarReturn" | "synastry" | "astrocartography";

const PAGE_TABS: PageTabId[] = ["natal", "moon", "yoga", "complete", "solarReturn", "synastry", "astrocartography"];

const TAB_REQUIREMENTS: Partial<Record<PageTabId, PaidPlan>> = {
  moon: "pro",
  yoga: "pro",
  complete: "avanzado",
  solarReturn: "avanzado",
  synastry: "avanzado",
  astrocartography: "avanzado",
};

const TAB_ICONS: Record<PageTabId, string> = {
  natal: "☉",
  moon: "☽",
  yoga: "♄",
  complete: "♃",
  solarReturn: "☌",
  synastry: "♀",
  astrocartography: "⌖",
};

function hasPlanAccess(currentPlan: string, requiredPlan?: PaidPlan) {
  if (!requiredPlan) {
    return true;
  }

  if (requiredPlan === "pro") {
    return currentPlan === "pro" || currentPlan === "avanzado";
  }

  return currentPlan === "avanzado";
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function getCity(locationLabel: string) {
  return locationLabel.split(",")[0]?.trim() || locationLabel;
}

function nameSizeClass(name: string) {
  if (name.length >= 14) return "text-[24px] sm:text-[34px] lg:text-[42px]";
  if (name.length >= 10) return "text-[30px] sm:text-[40px] lg:text-[48px]";
  if (name.length >= 6) return "text-[40px] sm:text-[50px] lg:text-[56px]";
  return "text-[44px] sm:text-[52px] lg:text-[72px]";
}

function stickyChartTitle(eyebrow: string, name: string) {
  const withoutArticle = eyebrow.replace(/^(la|the)\s+/i, "").trim();
  const normalized = withoutArticle || eyebrow.trim();
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} ${name}`;
}

function formatHeaderDate(dateLabel: string) {
  const normalized = dateLabel.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?)(?:,|\s+·)?\s+(\d{1,2}:\d{2})\b/);

  return match
    ? { date: match[1]?.trim() ?? normalized, time: match[2] ?? "" }
    : { date: normalized, time: "" };
}

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function normalizeMonthKey(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseLegacyChartDate(dateLabel: string, timezone: string) {
  const normalized = dateLabel.replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d{1,2})\s+de\s+([A-Za-zÁÉÍÓÚáéíóú]+)\s+de\s+(\d{4})(?:,\s*|\s+a\s+las\s+)(\d{1,2}:\d{2})?/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = SPANISH_MONTHS[normalizeMonthKey(match[2] ?? "")];
  const year = Number(match[3]);
  const [hourText, minuteText] = (match[4] ?? "00:00").split(":");

  if (!month || Number.isNaN(day) || Number.isNaN(year)) {
    return null;
  }

  return DateTime.fromObject(
    {
      year,
      month,
      day,
      hour: Number(hourText ?? "0"),
      minute: Number(minuteText ?? "0"),
    },
    { zone: timezone || "UTC" },
  );
}

function buildDisplayDateParts(chart: NatalChartData, request: FormValues | null, locale: Locale) {
  const timezone = chart.event.timezoneIdentifier || request?.selectedLocation?.timezone || "UTC";
  const fromRequest = request?.birthDate && request?.birthTime && !request.birthTimeUnknown
    ? DateTime.fromISO(`${request.birthDate}T${request.birthTime}`, { zone: timezone })
    : null;
  const dateTime = fromRequest?.isValid ? fromRequest : parseLegacyChartDate(chart.event.dateLabel, timezone);

  if (!dateTime || !dateTime.isValid) {
    return formatHeaderDate(chart.event.dateLabel);
  }

  const localized = dateTime.setLocale(locale);
  return {
    date: localized.toLocaleString({
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: localized.toLocaleString({
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

export function NatalChartExperience({
  chart,
  dictionary,
  locale,
  isMock = false,
  request = null,
  readingId,
}: NatalChartExperienceProps) {
  const { panelOpen, selectedPointId } = useChartStore();
  const { plan, loading: planLoading } = usePlan();
  const [pageTab, setPageTab] = useState<PageTabId>("natal");
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingRequiredPlan, setPricingRequiredPlan] = useState<PaidPlan>("pro");
  const tabListRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<PageTabId, HTMLButtonElement | null>>>({});
  const headerDate = buildDisplayDateParts(chart, request, locale);
  const headerSubtitle = [
    headerDate.date,
    headerDate.time,
    getCity(chart.event.locationLabel),
  ].filter(Boolean).join(" · ");
  const firstName = getFirstName(chart.event.name);
  const stickyTitle = stickyChartTitle(dictionary.result.chartHeader.eyebrow, firstName);
  const titleNameClass = nameSizeClass(firstName);
  const activeRequiredPlan = TAB_REQUIREMENTS[pageTab];
  const activeTabLocked = !planLoading && !hasPlanAccess(plan, activeRequiredPlan);

  function openPricing(requiredPlan: PaidPlan) {
    setPricingRequiredPlan(requiredPlan);
    setPricingOpen(true);
  }

  useEffect(() => {
    const tabList = tabListRef.current;
    const activeTab = tabRefs.current[pageTab];

    if (!tabList || !activeTab) {
      return;
    }

    const tabListRect = tabList.getBoundingClientRect();
    const activeTabRect = activeTab.getBoundingClientRect();
    const centeredOffset =
      activeTabRect.left -
      tabListRect.left -
      (tabListRect.width - activeTabRect.width) / 2;

    tabList.scrollTo({
      left: tabList.scrollLeft + centeredOffset,
      behavior: "smooth",
    });
  }, [pageTab]);

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[880px] px-3 pb-16 pt-3 sm:px-6 sm:pb-20 sm:pt-4 lg:max-w-[1180px] lg:px-8">
      <div className="space-y-3">
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setSectionMenuOpen(true)}
            className="flex w-full items-center justify-between rounded-[1.35rem] border border-dusty-gold/16 bg-[#fbf7ef]/90 px-4 py-3.5 text-left shadow-[0_12px_30px_rgba(30,26,46,0.06),inset_0_1px_0_rgba(255,255,255,0.72)]"
            aria-haspopup="dialog"
            aria-expanded={sectionMenuOpen}
          >
            <span className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dusty-gold/18 bg-white/80 text-[20px] text-[#5c4a24] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                {TAB_ICONS[pageTab]}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-[#8a7a4e]">
                  {dictionary.result.readingContextLabel}
                </span>
                <span className="mt-1 block min-w-0 truncate text-[13px] font-semibold uppercase tracking-[0.16em] text-[#1e1a2e]">
                  {dictionary.result.primaryTabs[pageTab]}
                </span>
              </span>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dusty-gold/16 bg-white/75 text-[15px] text-[#8a7a4e]">
              {"\u2304"}
            </span>
          </button>
          {sectionMenuOpen ? (
            <div className="fixed inset-0 z-[1000] bg-black/35 backdrop-blur-sm" onClick={() => setSectionMenuOpen(false)}>
              <div
                className="absolute inset-x-3 bottom-3 rounded-[2rem] border border-dusty-gold/20 bg-[#fbf7ef]/98 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.26)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-dusty-gold/22" />
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8a7a4e]">
                      {dictionary.result.readingContextLabel}
                    </p>
                    <p className="mt-1 font-serif text-[27px] leading-none text-ivory">
                      {dictionary.result.primaryTabs[pageTab]}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSectionMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/85 text-[20px] leading-none text-[#8a7a4e]"
                    aria-label={dictionary.common.close}
                  >
                    {"\u00d7"}
                  </button>
                </div>
                <div className="space-y-1.5">
                {PAGE_TABS.map((tab) => {
                  const active = pageTab === tab;
                  const requiredPlan = TAB_REQUIREMENTS[tab];
                  const locked = !planLoading && !hasPlanAccess(plan, requiredPlan);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setPageTab(tab);
                        setSectionMenuOpen(false);
                        if (locked && requiredPlan) {
                          openPricing(requiredPlan);
                        }
                      }}
                      className={[
                        "flex w-full items-center justify-between gap-3 rounded-[1.2rem] px-3.5 py-3.5 text-left transition",
                        active
                          ? "border border-dusty-gold/24 bg-dusty-gold/10 text-[#5c4a24] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                          : "border border-transparent text-[#1e1a2e] hover:bg-white/70",
                      ].join(" ")}
                    >
                      <span className="flex min-w-0 items-center gap-3.5">
                        <span
                          className={[
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[20px]",
                            active
                              ? "border-dusty-gold/24 bg-white/82 text-[#5c4a24]"
                              : "border-black/10 bg-white/76 text-[#6f5a2a]",
                          ].join(" ")}
                        >
                          {TAB_ICONS[tab]}
                        </span>
                        <span className="min-w-0">
                          <span className="block min-w-0 truncate text-[12px] font-semibold uppercase tracking-[0.16em]">
                            {dictionary.result.primaryTabs[tab]}
                          </span>
                          {locked && requiredPlan ? (
                            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#8a7a4e]">
                              {requiredPlan === "pro" ? dictionary.paywall.lockedBadgePro : dictionary.paywall.lockedBadgeAvanzado}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {active ? (
                        <span className="text-[18px] text-[#8a7a4e]">{"\u2713"}</span>
                      ) : locked && requiredPlan ? (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dusty-gold/16 bg-white/75 text-[14px] text-[#8a7a4e]">
                          {"\ud83d\udd12"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
        <div className="mb-2 flex flex-col gap-1 border-b border-dusty-gold/14 pb-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5c4a24]">
              {dictionary.result.readingContextLabel}
            </p>
            <p className="mt-1 font-serif text-[19px] leading-6 text-ivory sm:truncate sm:text-[18px]">
              {stickyTitle}
            </p>
          </div>
          <p className="text-[11px] font-semibold uppercase leading-5 tracking-[0.14em] text-[#3a3048] sm:max-w-[48%] sm:truncate sm:text-right sm:tracking-[0.18em]">
            {dictionary.result.primaryTabs[pageTab]}{headerSubtitle ? ` · ${headerSubtitle}` : ""}
          </p>
        </div>
        <div className="relative hidden md:block">
        <nav ref={tabListRef} className="flex max-w-full snap-x snap-mandatory gap-0 overflow-x-auto overscroll-x-contain border-b border-black/10 pb-0 pt-0 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          {PAGE_TABS.map((tab) => {
            const active = pageTab === tab;
            const requiredPlan = TAB_REQUIREMENTS[tab];
            const locked = !planLoading && !hasPlanAccess(plan, requiredPlan);
            return (
              <button
                key={tab}
                ref={(node) => {
                  tabRefs.current[tab] = node;
                }}
                type="button"
                onClick={() => {
                  setPageTab(tab);
                  if (locked && requiredPlan) {
                    openPricing(requiredPlan);
                  }
                }}
                className={[
                  "group flex-shrink-0 snap-center border-b-[1.5px] px-3 pb-2.5 pt-2 text-left transition sm:px-5 sm:pb-3",
                  active
                    ? "border-dusty-gold bg-transparent"
                    : locked
                      ? "border-transparent bg-dusty-gold/[0.06] hover:border-dusty-gold/30"
                      : "border-transparent bg-transparent hover:border-dusty-gold/30",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex items-center gap-1.5 text-[10px] font-semibold uppercase leading-none tracking-[0.16em] transition sm:gap-2 sm:text-[12px] sm:tracking-[0.22em]",
                    active ? "text-dusty-gold" : "text-[#3a3048] group-hover:text-ivory/78",
                  ].join(" ")}
                >
                  {locked ? <span aria-hidden="true">🔒</span> : null}
                  {dictionary.result.primaryTabs[tab]}
                  {locked && requiredPlan ? (
                    <span className="border border-dusty-gold/20 px-1.5 py-0.5 text-[10px] tracking-[0.1em] text-[#5c4a24] sm:text-[12px] sm:tracking-[0.14em]">
                      {requiredPlan === "pro" ? dictionary.paywall.lockedBadgePro : dictionary.paywall.lockedBadgeAvanzado}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-cosmic-950 to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cosmic-950 to-transparent md:hidden" />
        </div>
        <div className="mt-2 hidden justify-center gap-1.5 md:hidden" aria-hidden="true">
          {PAGE_TABS.map((tab) => (
            <span
              key={tab}
              className={[
                "h-1 rounded-full transition-all",
                pageTab === tab ? "w-5 bg-dusty-gold" : "w-1.5 bg-black/18",
              ].join(" ")}
            />
          ))}
        </div>
        </div>
        <ReadingUsageBanner dictionary={dictionary} />
      </div>

      {activeTabLocked && activeRequiredPlan ? (
        <div className="mx-auto mt-16 max-w-2xl border-y border-dusty-gold/14 py-14 text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            {dictionary.result.primaryTabs[pageTab]}
          </p>
          <h2 className="mt-3 font-serif text-[32px] leading-tight text-ivory sm:text-[38px]">
            {dictionary.paywall.lockedTabTitle.replace(
              "{plan}",
              activeRequiredPlan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName,
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#3a3048]">
            {dictionary.paywall.lockedTabBody.replace(
              "{plan}",
              activeRequiredPlan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName,
            )}
          </p>
          <button
            type="button"
            onClick={() => openPricing(activeRequiredPlan)}
            className="mt-8 border border-dusty-gold/32 bg-dusty-gold/10 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24] transition hover:border-dusty-gold/55 hover:bg-dusty-gold/16"
          >
            {dictionary.paywall.lockedTabCta}
          </button>
        </div>
      ) : null}

      {pageTab === "natal" && !activeTabLocked ? (
        <>
          <div className="mx-auto mt-7 max-w-2xl text-center sm:mt-8">
            <p className="text-[13px] leading-6 text-[#3a3048] sm:text-sm sm:leading-7">
              {dictionary.result.chartHeader.intro}
            </p>
          </div>

          <section className="pt-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isMock ? (
                <div className="rounded-full border border-dusty-gold/18 bg-dusty-gold/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#5c4a24]">
                  {dictionary.result.messages.mockNotice}
                </div>
              ) : null}
            </div>

            <div className="mb-7 mt-8 text-center sm:mb-10 sm:mt-10 lg:hidden">
              <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-dusty-gold">
                {dictionary.result.chartHeader.eyebrow}
              </p>
              <h1 className={`mx-auto -mt-1 max-w-full whitespace-nowrap font-serif font-normal leading-none text-ivory [overflow-wrap:normal] [word-break:normal] ${titleNameClass}`}>
                {firstName}
              </h1>
              <p className="mt-4 font-serif text-[14px] italic text-[#3a3048]">
                {headerSubtitle}
              </p>
            </div>

            <div className="relative mx-auto max-w-[56rem] py-4 sm:py-6 lg:max-w-[1180px]">
              <div className="space-y-6 lg:grid lg:grid-cols-[minmax(220px,1fr)_minmax(500px,640px)_minmax(180px,0.75fr)] lg:items-center lg:gap-8 lg:space-y-0">
                <div className="hidden min-w-0 text-right lg:block">
                  <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-dusty-gold">
                    {dictionary.result.chartHeader.eyebrow}
                  </p>
                  <h1 className={`-mt-1 ml-auto max-w-[360px] whitespace-nowrap font-serif font-normal leading-none text-ivory [overflow-wrap:normal] [word-break:normal] ${titleNameClass}`}>
                    {firstName}
                  </h1>
                  <p className="ml-auto mt-4 max-w-[260px] font-serif text-[15px] italic leading-6 text-[#3a3048]">
                    {headerSubtitle}
                  </p>
                </div>

                <div className="sarita-natal-chart relative z-10 flex justify-center">
                  <NatalChartWheel chart={chart} />
                </div>
                <div className="min-w-0 lg:self-center">
                  <ChartLayerRail />
                </div>
              </div>
            </div>

            {!panelOpen && !selectedPointId ? (
              <p className="mt-3 text-center font-serif text-[13px] italic text-[#3a3048]">
                {dictionary.result.chartHeader.selectPlanet}
              </p>
            ) : null}
            <ChartShareActions chart={chart} dictionary={dictionary} plan={plan} />

            {!panelOpen && !selectedPointId ? (
              <div className="mx-auto mt-8 max-w-3xl border-y border-dusty-gold/16 py-6 text-center">
                <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
                  {dictionary.yogaAstral.title}
                </p>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#3a3048]">
                  {dictionary.yogaAstral.intro}
                </p>
                {!planLoading && !hasPlanAccess(plan, "pro") ? (
                  <PrimaryButton
                    type="button"
                    variant="ghostGold"
                    onClick={() => openPricing("pro")}
                    className="mt-5 px-5 py-3 text-[12px] uppercase tracking-[0.18em]"
                  >
                    <span aria-hidden="true" className="mr-2">🔒</span>
                    {dictionary.yogaAstral.title}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    href="/yoga-astral"
                    variant="ghostGold"
                    className="mt-5 px-5 py-3 text-[12px] uppercase tracking-[0.18em]"
                  >
                    {dictionary.yogaAstral.title}
                  </PrimaryButton>
                )}
              </div>
            ) : null}
          </section>

          {!panelOpen && !selectedPointId ? (
            <div className="mt-12 space-y-0 lg:mt-16">
              <ChartBalanceSection chart={chart} dictionary={dictionary} />
              <ChartGeneralReading chart={chart} dictionary={dictionary} readingId={readingId} gender={request?.gender || undefined} />
            </div>
          ) : null}

          <PlanetDetailPanel chart={chart} dictionary={dictionary} readingId={readingId} gender={request?.gender || undefined} />
          <AspectDetailPanel chart={chart} />
        </>
      ) : null}

      {pageTab === "moon" && !activeTabLocked ? <LunaDelMesPage chart={chart} dictionary={dictionary} readingId={readingId} gender={request?.gender || undefined} /> : null}

      {pageTab === "yoga" && !activeTabLocked ? <YogaAstralPage chart={chart} dictionary={dictionary} locale={locale} /> : null}

      {pageTab === "complete" && !activeTabLocked ? (
        <ChartCompletePage chart={chart} request={request} dictionary={dictionary} readingId={readingId} />
      ) : null}

      {pageTab === "solarReturn" && !activeTabLocked ? (
        <SolarReturnPage natalChart={chart} request={request} dictionary={dictionary} readingId={readingId} />
      ) : null}

      {pageTab === "synastry" && !activeTabLocked ? (
        <SynastryPage natalChart={chart} dictionary={dictionary} readingId={readingId} gender={request?.gender || undefined} />
      ) : null}

      {pageTab === "astrocartography" && !activeTabLocked ? (
        <AstrocartographyPage chart={chart} request={request} dictionary={dictionary} readingId={readingId} gender={request?.gender || undefined} />
      ) : null}

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        requiredPlan={pricingRequiredPlan}
      />
    </div>
  );
}
