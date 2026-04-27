"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CHART_RESULT_KEY, type ChartCalculationResult } from "@/lib/chart-session";

function parseCoordinateLabel(label: string) {
  const values = label.match(/\d+(?:\.\d+)?/g);
  const directionMatch = label.match(/[NSEW]/i);

  if (!values || values.length === 0 || !directionMatch) {
    return null;
  }

  const [degrees = "0", minutes = "0", seconds = "0"] = values;
  const direction = directionMatch[0]!.toUpperCase();
  const sign = direction === "S" || direction === "W" ? -1 : 1;
  const decimal =
    Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;

  return sign * decimal;
}

function buildQueryFromStoredResult(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const result = JSON.parse(raw) as ChartCalculationResult;
    const selectedLocation = result.request.selectedLocation;
    const chart = result.chart;

    const lat =
      selectedLocation?.lat ?? parseCoordinateLabel(chart.event.latitude);
    const lng =
      selectedLocation?.lng ?? parseCoordinateLabel(chart.event.longitude);
    const timezone =
      selectedLocation?.timezone ?? chart.event.timezoneIdentifier;
    const location =
      selectedLocation?.displayName ?? chart.event.locationLabel;

    if (
      !result.request.birthDate ||
      !result.request.birthTime ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !timezone
    ) {
      return null;
    }

    const params = new URLSearchParams({
      name: result.request.name || chart.event.name || "Carta debug",
      birthDate: result.request.birthDate,
      birthTime: result.request.birthTime,
      lat: String(lat),
      lng: String(lng),
      timezone,
      location,
    });

    return params.toString();
  } catch {
    return null;
  }
}

export function DebugChartLoader() {
  const router = useRouter();
  const [status] = useState(
    "Buscando la última carta calculada… Si no se redirige, no hemos encontrado una carta guardada utilizable. Puedes abrir esta ruta con query params o usar uno de los presets de prueba.",
  );

  useEffect(() => {
    const localRaw = window.localStorage.getItem(CHART_RESULT_KEY);
    const sessionRaw = window.sessionStorage.getItem(CHART_RESULT_KEY);
    const query =
      buildQueryFromStoredResult(localRaw) ??
      buildQueryFromStoredResult(sessionRaw);

    if (query) {
      router.replace(`/debug/chart?${query}`);
    }
  }, [router]);

  return (
    <div className="rounded border border-white/15 bg-white/5 p-4">
      <p>{status}</p>
      <p className="mt-3 text-white/70">
        Se intentan leer primero <code>localStorage[&quot;sarita_chart&quot;]</code> y después{" "}
        <code>sessionStorage[&quot;sarita_chart&quot;]</code>.
      </p>
    </div>
  );
}
