"use client";

import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";
import type { FormValues } from "@/lib/chart-session";

import { AspectDetailPanel } from "@/components/chart/aspect-detail-panel";
import { ChartBalanceSection } from "@/components/chart/chart-balance-section";
import { ChartCompletePage } from "@/components/chart/chart-complete-page";
import { ChartGeneralReading } from "@/components/chart/chart-general-reading";
import { useChartStore } from "@/components/chart/chart-store";
import { ChartLayerRail, NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import { PlanetDetailPanel } from "@/components/chart/planet-detail-panel";
import { SolarReturnPage } from "@/components/chart/solar-return-page";
import { SynastryPage } from "@/components/chart/synastry-page";
import { LunaDelMesPage } from "@/components/lunar/luna-del-mes-page";
import { YogaAstralPage } from "@/components/yoga/yoga-astral-page";

type NatalChartExperienceProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  isMock?: boolean;
  plan?: string;
  request?: FormValues | null;
};

type PageTabId = "natal" | "moon" | "yoga" | "complete" | "solarReturn" | "synastry";

const PAGE_TABS: PageTabId[] = ["natal", "moon", "yoga", "complete", "solarReturn", "synastry"];

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function getCity(locationLabel: string) {
  return locationLabel.split(",")[0]?.trim() || locationLabel;
}

function nameSizeClass(name: string) {
  if (name.length >= 12) return "text-[40px] sm:text-[46px] lg:text-[50px]";
  if (name.length >= 9) return "text-[44px] sm:text-[52px] lg:text-[58px]";
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
  const [pageTab, setPageTab] = useState<PageTabId>("natal");
  const headerDate = formatHeaderDate(chart.event.dateLabel);
  const headerSubtitle = [
    headerDate.date,
    headerDate.time,
    getCity(chart.event.locationLabel),
  ].filter(Boolean).join(" · ");
  const firstName = getFirstName(chart.event.name);
  const titleNameClass = nameSizeClass(firstName);

  return (
    <div className="relative mx-auto max-w-[880px] pb-20 lg:max-w-[1180px]">
      <div className="space-y-3">
        <nav className="flex gap-0 border-b border-white/8 pb-0 pt-1">
          {PAGE_TABS.map((tab) => {
            const active = pageTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPageTab(tab)}
                className={[
                  "group border-b-[1.5px] px-5 pb-3 pt-2 text-left transition",
                  active
                    ? "border-dusty-gold bg-transparent"
                    : "border-transparent bg-transparent hover:border-dusty-gold/30",
                ].join(" ")}
              >
                <span
                  className={[
                    "block text-[0.65rem] font-semibold uppercase leading-none tracking-[0.22em] transition",
                    active ? "text-dusty-gold" : "text-ivory/52 group-hover:text-ivory/78",
                  ].join(" ")}
                >
                  {dictionary.result.primaryTabs[tab]}
                </span>
              </button>
            );
          })}
        </nav>

        {pageTab === "yoga" ? <YogaAstralPage chart={chart} /> : null}
      </div>

      {pageTab === "natal" ? (
        <>
          <section className="pt-8">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isMock ? (
                <div className="rounded-full border border-dusty-gold/18 bg-dusty-gold/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-dusty-gold/82">
                  {dictionary.result.messages.mockNotice}
                </div>
              ) : null}
            </div>

            <div className="mt-10 mb-10 text-center lg:hidden">
              <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.35)]">
                la carta de
              </p>
              <h1 className={`mx-auto -mt-1 max-w-full break-words font-serif font-normal leading-none text-ivory [overflow-wrap:anywhere] ${titleNameClass}`}>
                {firstName}
              </h1>
              <p className="mt-4 font-serif text-[14px] italic text-[rgba(255,255,255,0.5)]">
                {headerSubtitle}
              </p>
            </div>

            <div className="relative mx-auto max-w-[56rem] py-6 lg:max-w-[1180px]">
              <div className="space-y-6 lg:grid lg:grid-cols-[minmax(220px,1fr)_minmax(500px,640px)_minmax(140px,0.65fr)] lg:items-center lg:gap-8 lg:space-y-0">
                <div className="hidden min-w-0 text-right lg:block">
                  <p className="font-serif text-[13px] font-light italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.35)]">
                    la carta de
                  </p>
                  <h1 className={`-mt-1 ml-auto max-w-[300px] break-words font-serif font-normal leading-none text-ivory [overflow-wrap:anywhere] ${titleNameClass}`}>
                    {firstName}
                  </h1>
                  <p className="ml-auto mt-4 max-w-[260px] font-serif text-[15px] italic leading-6 text-[rgba(255,255,255,0.5)]">
                    {headerSubtitle}
                  </p>
                </div>

                <div className="relative z-10 flex justify-center">
                  <NatalChartWheel chart={chart} />
                </div>
                <div className="min-w-0 lg:self-center">
                  <ChartLayerRail />
                </div>
              </div>
            </div>

            {!panelOpen && !selectedPointId ? (
              <p className="mt-3 text-center font-serif text-[13px] italic text-[rgba(255,255,255,0.32)]">
                selecciona un planeta para abrir su lectura
              </p>
            ) : null}
          </section>

          {!panelOpen && !selectedPointId ? (
            <div className="mt-12 space-y-0 lg:mt-16">
              <ChartBalanceSection chart={chart} dictionary={dictionary} />
              <ChartGeneralReading chart={chart} dictionary={dictionary} />
            </div>
          ) : null}

          <PlanetDetailPanel chart={chart} dictionary={dictionary} />
          <AspectDetailPanel chart={chart} />
        </>
      ) : null}

      {pageTab === "moon" ? <LunaDelMesPage chart={chart} dictionary={dictionary} /> : null}

      {pageTab === "complete" ? (
        <ChartCompletePage chart={chart} request={request} dictionary={dictionary} />
      ) : null}

      {pageTab === "solarReturn" ? (
        <SolarReturnPage natalChart={chart} request={request} dictionary={dictionary} />
      ) : null}

      {pageTab === "synastry" ? (
        <SynastryPage natalChart={chart} dictionary={dictionary} />
      ) : null}
    </div>
  );
}
