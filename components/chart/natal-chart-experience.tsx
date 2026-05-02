"use client";

import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";

import { AspectDetailPanel } from "@/components/chart/aspect-detail-panel";
import { ChartBalanceSection } from "@/components/chart/chart-balance-section";
import { ChartCompletePage } from "@/components/chart/chart-complete-page";
import { ChartGeneralReading } from "@/components/chart/chart-general-reading";
import { ChartShareActions } from "@/components/chart/chart-share-actions";
import { ReadingUsageBanner } from "@/components/chart/reading-usage-banner";
import { ChartSignaturesSection } from "@/components/chart/chart-signatures-section";
import { useChartStore } from "@/components/chart/chart-store";
import { ChartLayerRail, NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import { PlanetDetailPanel } from "@/components/chart/planet-detail-panel";
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
  isMock?: boolean;
  request?: FormValues | null;
};

type PageTabId = "natal" | "moon" | "yoga" | "complete" | "solarReturn" | "synastry";

const PAGE_TABS: PageTabId[] = ["natal", "moon", "yoga", "complete", "solarReturn", "synastry"];

const TAB_REQUIREMENTS: Partial<Record<PageTabId, PaidPlan>> = {
  moon: "pro",
  yoga: "pro",
  complete: "avanzado",
  solarReturn: "avanzado",
  synastry: "avanzado",
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
  if (name.length >= 14) return "text-[34px] sm:text-[40px] lg:text-[44px]";
  if (name.length >= 10) return "text-[38px] sm:text-[44px] lg:text-[50px]";
  if (name.length >= 6) return "text-[44px] sm:text-[50px] lg:text-[56px]";
  return "text-[52px] lg:text-[72px]";
}

function formatHeaderDate(dateLabel: string) {
  const normalized = dateLabel.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^(.+?)(?:,|\s+·)?\s+(\d{1,2}:\d{2})\b/);

  return match
    ? { date: match[1]?.trim() ?? normalized, time: match[2] ?? "" }
    : { date: normalized, time: "" };
}

export function NatalChartExperience({
  chart,
  dictionary,
  isMock = false,
  request = null,
}: NatalChartExperienceProps) {
  const { panelOpen, selectedPointId } = useChartStore();
  const { plan, loading: planLoading } = usePlan();
  const [pageTab, setPageTab] = useState<PageTabId>("natal");
  const [pricingOpen, setPricingOpen] = useState(false);
  const [pricingRequiredPlan, setPricingRequiredPlan] = useState<PaidPlan>("pro");
  const headerDate = formatHeaderDate(chart.event.dateLabel);
  const headerSubtitle = [
    headerDate.date,
    headerDate.time,
    getCity(chart.event.locationLabel),
  ].filter(Boolean).join(" · ");
  const firstName = getFirstName(chart.event.name);
  const titleNameClass = nameSizeClass(firstName);
  const activeRequiredPlan = TAB_REQUIREMENTS[pageTab];
  const activeTabLocked = !planLoading && !hasPlanAccess(plan, activeRequiredPlan);

  function openPricing(requiredPlan: PaidPlan) {
    setPricingRequiredPlan(requiredPlan);
    setPricingOpen(true);
  }

  return (
    <div className="relative mx-auto max-w-[880px] px-4 pb-20 sm:px-6 lg:max-w-[1180px] lg:px-8">
      <div className="space-y-3">
        <div className="relative">
        <nav className="flex gap-0 overflow-x-auto border-b border-black/10 pb-0 pt-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
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
                  if (locked && requiredPlan) {
                    openPricing(requiredPlan);
                  }
                }}
                className={[
                  "group flex-shrink-0 border-b-[1.5px] px-5 pb-3 pt-2 text-left transition",
                  active
                    ? "border-dusty-gold bg-transparent"
                    : locked
                      ? "border-transparent bg-dusty-gold/[0.06] hover:border-dusty-gold/30"
                      : "border-transparent bg-transparent hover:border-dusty-gold/30",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex items-center gap-2 text-[12px] font-semibold uppercase leading-none tracking-[0.22em] transition",
                    active ? "text-dusty-gold" : "text-[#3a3048] group-hover:text-ivory/78",
                  ].join(" ")}
                >
                  {locked ? <span aria-hidden="true">🔒</span> : null}
                  {dictionary.result.primaryTabs[tab]}
                  {locked && requiredPlan ? (
                    <span className="border border-dusty-gold/20 px-1.5 py-0.5 text-[12px] tracking-[0.14em] text-[#5c4a24]">
                      {requiredPlan === "pro" ? dictionary.paywall.lockedBadgePro : dictionary.paywall.lockedBadgeAvanzado}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cosmic-950 to-transparent md:hidden" />
        </div>
        <ReadingUsageBanner dictionary={dictionary} />

        {pageTab === "yoga" && !activeTabLocked ? <YogaAstralPage chart={chart} /> : null}
      </div>

      {activeTabLocked && activeRequiredPlan ? (
        <div className="mx-auto mt-16 max-w-2xl border-y border-dusty-gold/14 py-14 text-center">
          <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
            {dictionary.result.primaryTabs[pageTab]}
          </p>
          <h2 className="mt-3 font-serif text-[38px] leading-tight text-ivory">
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
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-sm leading-7 text-[#3a3048]">
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

            <div className="mt-10 mb-10 text-center lg:hidden">
              <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-dusty-gold">
                {dictionary.result.chartHeader.eyebrow}
              </p>
              <h1 className={`mx-auto -mt-1 max-w-full break-words font-serif font-normal leading-none text-ivory [overflow-wrap:break-word] ${titleNameClass}`}>
                {firstName}
              </h1>
              <p className="mt-4 font-serif text-[14px] italic text-[#3a3048]">
                {headerSubtitle}
              </p>
            </div>

            <div className="relative mx-auto max-w-[56rem] py-6 lg:max-w-[1180px]">
              <div className="space-y-6 lg:grid lg:grid-cols-[minmax(220px,1fr)_minmax(500px,640px)_minmax(180px,0.75fr)] lg:items-center lg:gap-8 lg:space-y-0">
                <div className="hidden min-w-0 text-right lg:block">
                  <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-dusty-gold">
                    {dictionary.result.chartHeader.eyebrow}
                  </p>
                  <h1 className={`-mt-1 ml-auto max-w-[360px] break-words font-serif font-normal leading-none text-ivory [overflow-wrap:break-word] ${titleNameClass}`}>
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
          </section>

          {!panelOpen && !selectedPointId ? (
            <div className="mt-12 space-y-0 lg:mt-16">
              <ChartBalanceSection chart={chart} dictionary={dictionary} />
              <ChartSignaturesSection chart={chart} dictionary={dictionary} />
              <ChartGeneralReading chart={chart} dictionary={dictionary} />
            </div>
          ) : null}

          <PlanetDetailPanel chart={chart} dictionary={dictionary} />
          <AspectDetailPanel chart={chart} />
        </>
      ) : null}

      {pageTab === "moon" && !activeTabLocked ? <LunaDelMesPage chart={chart} dictionary={dictionary} /> : null}

      {pageTab === "complete" && !activeTabLocked ? (
        <ChartCompletePage chart={chart} request={request} dictionary={dictionary} />
      ) : null}

      {pageTab === "solarReturn" && !activeTabLocked ? (
        <SolarReturnPage natalChart={chart} request={request} dictionary={dictionary} />
      ) : null}

      {pageTab === "synastry" && !activeTabLocked ? (
        <SynastryPage natalChart={chart} dictionary={dictionary} />
      ) : null}

      <PricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        requiredPlan={pricingRequiredPlan}
      />
    </div>
  );
}
