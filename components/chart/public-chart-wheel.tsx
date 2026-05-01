"use client";

import { NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import type { NatalChartData } from "@/lib/chart";

export function PublicChartWheel({ chart }: { chart: NatalChartData }) {
  return (
    <div className="pointer-events-none mx-auto max-w-[54rem]">
      <NatalChartWheel chart={chart} />
    </div>
  );
}
