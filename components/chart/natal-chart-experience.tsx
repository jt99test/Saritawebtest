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
import { LunaDelMesPage } from "@/components/lunar/luna-del-mes-page";
import { PlanGate } from "@/components/ui/plan-gate";
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
  plan = "free",
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
              <h1 className="-mt-1 font-serif text-[52px] font-normal leading-none text-ivory">
                {getFirstName(chart.event.name)}
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
                  <h1 className="-mt-1 font-serif text-[72px] font-normal leading-none text-ivory">
                    {getFirstName(chart.event.name)}
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
        <PlanGate plan={plan} featureName={dictionary.result.primaryTabs.complete} dictionary={dictionary}>
          <ChartCompletePage chart={chart} request={request} dictionary={dictionary} />
        </PlanGate>
      ) : null}

      {pageTab === "solarReturn" ? (
        <PlanGate plan={plan} featureName={dictionary.result.primaryTabs.solarReturn} dictionary={dictionary}>
          <ComingSoonPanel
            title={dictionary.result.solarReturn.title}
            subtitle={dictionary.result.solarReturn.subtitle}
            body={dictionary.result.solarReturn.body}
          />
        </PlanGate>
      ) : null}

      {pageTab === "synastry" ? (
        <PlanGate plan={plan} featureName={dictionary.result.primaryTabs.synastry} dictionary={dictionary}>
          <ComingSoonPanel
            title={dictionary.result.synastry.title}
            subtitle={dictionary.result.synastry.subtitle}
            body={dictionary.result.synastry.body}
          />
        </PlanGate>
      ) : null}
    </div>
  );
}

function ComingSoonPanel({ title, subtitle, body }: { title: string; subtitle: string; body: string }) {
  return (
    <section className="mx-auto max-w-2xl py-24 text-center">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        {subtitle}
      </p>
      <h2 className="mt-3 font-serif text-[48px] leading-tight text-ivory lg:text-[64px]">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-ivory/58">{body}</p>
    </section>
  );
}
