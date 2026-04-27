"use client";

import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";

import { ChartBalanceSection } from "@/components/chart/chart-balance-section";
import { ChartGeneralReading } from "@/components/chart/chart-general-reading";
import { useChartStore } from "@/components/chart/chart-store";
import { ChartLayerRail, NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import { PlanetDetailPanel } from "@/components/chart/planet-detail-panel";
import { LunaDelMesPage } from "@/components/lunar/luna-del-mes-page";
import { YogaAstralPage } from "@/components/yoga/yoga-astral-page";

type NatalChartExperienceProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  isMock?: boolean;
};

type PageTabId = "natal" | "moon" | "yoga";

const PAGE_TABS: PageTabId[] = ["natal", "moon", "yoga"];

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function getCity(locationLabel: string) {
  return locationLabel.split(",")[0]?.trim() || locationLabel;
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
}: NatalChartExperienceProps) {
  const { panelOpen, selectedPointId } = useChartStore();
  const [pageTab, setPageTab] = useState<PageTabId>("natal");
  const headerDate = formatHeaderDate(chart.event.dateLabel);
  const headerSubtitle = [
    headerDate.date,
    headerDate.time,
    getCity(chart.event.locationLabel),
  ].filter(Boolean).join(" · ");

  return (
    <div className="relative mx-auto max-w-[880px] pb-24 lg:max-w-[1200px]">
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/8 pb-3">
          {PAGE_TABS.map((tab) => {
            const active = pageTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setPageTab(tab)}
                className="group relative pb-2 text-left transition"
              >
                <span className="font-serif text-lg text-ivory/72 transition group-hover:text-ivory">
                  {dictionary.result.primaryTabs[tab]}
                </span>
                <span
                  className={[
                    "absolute inset-x-0 -bottom-0.5 h-px origin-left transition",
                    active ? "scale-x-100 bg-[rgba(232,197,71,0.6)]" : "scale-x-0 bg-transparent",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </nav>

        {pageTab === "yoga" ? <YogaAstralPage chart={chart} /> : null}
      </div>

      {pageTab === "natal" ? (
        <>
          <section className="pt-10 lg:mb-40">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isMock ? (
                <div className="rounded-full border border-dusty-gold/18 bg-dusty-gold/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-dusty-gold/82">
                  {dictionary.result.messages.mockNotice}
                </div>
              ) : null}
            </div>

            <div className="mt-12 mb-20 text-center lg:hidden">
              <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.5)]">
                la carta de
              </p>
              <h1 className="mt-2 font-serif text-[56px] font-normal leading-none tracking-[-0.01em] text-ivory">
                {getFirstName(chart.event.name)}
              </h1>
              <p className="mt-2 font-serif text-[14px] italic text-[rgba(255,255,255,0.5)]">
                {headerSubtitle}
              </p>
            </div>

            <div className="relative mx-auto max-w-[60rem] lg:max-w-[1200px]">
              <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-16 lg:space-y-0">
                <div className="hidden text-right lg:block">
                  <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-[rgba(232,197,71,0.5)]">
                    la carta de
                  </p>
                  <h1 className="mt-2 font-serif text-[88px] font-normal leading-none tracking-[-0.01em] text-ivory">
                    {getFirstName(chart.event.name)}
                  </h1>
                  <p className="mt-2 font-serif text-[15px] italic text-[rgba(255,255,255,0.5)]">
                    {headerSubtitle}
                  </p>
                </div>

                <div className="relative flex justify-center lg:w-[520px]">
                  <NatalChartWheel chart={chart} />
                </div>
                <div className="lg:self-center">
                  <ChartLayerRail />
                </div>
              </div>
            </div>

            {!panelOpen && !selectedPointId ? (
              <p className="mt-8 text-center font-serif text-[14px] italic text-[rgba(255,255,255,0.4)]">
                toca un planeta para abrir su lectura
              </p>
            ) : null}
          </section>

          {!panelOpen && !selectedPointId ? (
            <div className="mt-8 space-y-8 lg:mt-0">
              <ChartBalanceSection chart={chart} dictionary={dictionary} />
              <ChartGeneralReading chart={chart} dictionary={dictionary} />
            </div>
          ) : null}

          <PlanetDetailPanel chart={chart} dictionary={dictionary} />
        </>
      ) : null}

      {pageTab === "moon" ? <LunaDelMesPage chart={chart} dictionary={dictionary} /> : null}
    </div>
  );
}
