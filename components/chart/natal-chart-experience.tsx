"use client";

import { useState } from "react";
import { motion } from "motion/react";

import type { Dictionary } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";

import { ChartGeneralReading } from "@/components/chart/chart-general-reading";
import { useChartStore } from "@/components/chart/chart-store";
import { NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import { PlanetDetailPanel } from "@/components/chart/planet-detail-panel";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PremiumCard } from "@/components/ui/premium-card";

type NatalChartExperienceProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
  isMock?: boolean;
};

type PageTabId = "natal" | "moon" | "yoga" | "transits";

const PAGE_TABS: PageTabId[] = ["natal", "moon", "yoga", "transits"];

export function NatalChartExperience({
  chart,
  dictionary,
  isMock = false,
}: NatalChartExperienceProps) {
  const { panelOpen, selectedPointId } = useChartStore();
  const [variant, setVariant] = useState<"default" | "astronomical" | "symbolic">("default");
  const [pageTab, setPageTab] = useState<PageTabId>("natal");
  const metaPills = [
    chart.event.dateLabel,
    chart.event.locationLabel,
    dictionary.result.settingsValues[chart.settings.houseSystem],
  ];

  return (
    <div className="relative space-y-8 pb-8">
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/8 pb-3">
          {PAGE_TABS.map((tab) => {
            const active = pageTab === tab;
            const isPremium = tab === "transits";

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
                {isPremium ? (
                  <span className="ml-2 rounded-full border border-dusty-gold/24 bg-dusty-gold/10 px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-dusty-gold/86">
                    {dictionary.result.primaryTabs.premium}
                  </span>
                ) : null}
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

        {pageTab !== "natal" ? (
          <PremiumCard className="rounded-[2rem] border-dusty-gold/16 bg-[linear-gradient(180deg,rgba(17,11,28,0.78),rgba(8,10,18,0.68))] p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <Eyebrow className="justify-center text-dusty-gold/76">
              {dictionary.result.primaryTabs[pageTab]}
            </Eyebrow>
            <h2 className="mt-4 text-3xl text-ivory sm:text-[2.4rem]">
              {dictionary.result.primaryTabs.upcoming}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ivory/62">
              {dictionary.result.primaryTabs.upcomingMessage}
            </p>
          </PremiumCard>
        ) : null}
      </div>

      {pageTab === "natal" ? (
        <>
          <PremiumCard className="overflow-hidden border-dusty-gold/16 bg-[linear-gradient(180deg,rgba(23,12,36,0.8),rgba(8,10,18,0.72))] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(116,73,182,0.14),transparent_34%),linear-gradient(180deg,rgba(15,10,28,0.92),rgba(8,10,18,0.86))] px-4 pb-8 pt-6 sm:px-8">
              <div className="absolute inset-x-16 top-10 h-28 rounded-full bg-[radial-gradient(circle,rgba(171,132,90,0.12),transparent_72%)] blur-3xl" />

              <div className="relative text-center">
                <Eyebrow className="justify-center text-dusty-gold/82">
                  {dictionary.result.eyebrow}
                </Eyebrow>
                <h1 className="mt-5 text-4xl leading-tight text-ivory sm:text-[3.25rem]">
                  {chart.event.title || dictionary.result.title}
                </h1>
                <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-ivory/64">
                  {dictionary.result.subtitle}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  {metaPills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-ivory/54"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                    {(["default", "astronomical", "symbolic"] as const).map((entry) => {
                      const active = variant === entry;

                      return (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setVariant(entry)}
                          className={[
                            "rounded-full px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] transition",
                            active ? "bg-white text-cosmic-950" : "text-ivory/56 hover:text-ivory",
                          ].join(" ")}
                        >
                          {dictionary.result.variants[entry]}
                        </button>
                      );
                    })}
                  </div>

                  {isMock ? (
                    <div className="rounded-full border border-dusty-gold/18 bg-dusty-gold/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-dusty-gold/82">
                      {dictionary.result.messages.mockNotice}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="relative mx-auto mt-8 max-w-[45rem]">
                <div className="absolute inset-x-12 top-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(119,138,208,0.12),transparent_70%)] blur-3xl" />
                <div className="relative flex justify-center rounded-[2rem] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(30,18,44,0.34),rgba(9,12,22,0.18)_50%,transparent_78%)] px-2 pb-2 pt-2 sm:px-3 sm:pb-3">
                  <NatalChartWheel chart={chart} variant={variant} />
                </div>
              </div>

              {!panelOpen && !selectedPointId ? (
                <motion.p
                  className="mt-6 text-center text-sm leading-7 text-[#cdbcf4]"
                  animate={{ opacity: [0.5, 0.9, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  {dictionary.result.prompt}
                </motion.p>
              ) : null}
            </div>
          </PremiumCard>

          {!panelOpen && !selectedPointId ? (
            <ChartGeneralReading chart={chart} dictionary={dictionary} />
          ) : null}

          <PlanetDetailPanel chart={chart} dictionary={dictionary} />
        </>
      ) : null}
    </div>
  );
}
