"use client";

import { NatalChartWheel } from "@/components/chart/natal-chart-wheel";
import type { NatalChartData } from "@/lib/chart";

export function PublicChartWheel({ chart }: { chart: NatalChartData }) {
  return (
    <div className="mx-auto flex max-w-[54rem] justify-center">
      <NatalChartWheel chart={chart} />
    </div>
  );
}
