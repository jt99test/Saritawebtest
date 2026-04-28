"use client";

import { useRouter } from "next/navigation";

import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";

type StoredReading = {
  id: string;
  type: string | null;
  chart_data: unknown;
  created_at: string;
};

function getStoredResult(reading: StoredReading): ChartCalculationResult | null {
  const data = reading.chart_data as Partial<ChartCalculationResult> | null;

  if (!data?.chart || !data.request || typeof data.isMock !== "boolean") {
    return null;
  }

  return data as ChartCalculationResult;
}

export function ReadingsList({ readings }: { readings: StoredReading[] }) {
  const router = useRouter();

  if (!readings.length) {
    return (
      <p className="mt-8 border-t border-dusty-gold/14 pt-6 font-serif text-[17px] italic leading-7 text-ivory/52">
        Aún no hay lecturas guardadas en esta cuenta.
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-dusty-gold/14">
      {readings.map((reading) => {
        const result = getStoredResult(reading);
        const label = result?.chart.event.name ?? "Lectura";
        const date = new Intl.DateTimeFormat("es", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(reading.created_at));

        return (
          <button
            key={reading.id}
            type="button"
            disabled={!result}
            onClick={() => {
              if (!result) {
                return;
              }

              window.sessionStorage.setItem(CHART_RESULT_KEY, JSON.stringify(result));
              router.push("/resultado");
            }}
            className="grid w-full gap-2 border-b border-white/8 py-5 text-left transition enabled:hover:border-dusty-gold/24 disabled:cursor-not-allowed disabled:opacity-50 sm:grid-cols-[1fr_auto] sm:items-center"
          >
            <div>
              <p className="font-serif text-[21px] leading-tight text-ivory">
                {label}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/38">
                {reading.type} · {date}
              </p>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/62">
              abrir
            </span>
          </button>
        );
      })}
    </div>
  );
}
