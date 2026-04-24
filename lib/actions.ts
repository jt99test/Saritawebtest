"use server";

import type { NatalChartData } from "./chart";
import { mockNatalChart } from "./chart";
import type { ChartCalculationResult, FormValues } from "./chart-session";

export async function calculateChartAction(values: FormValues): Promise<ChartCalculationResult> {
  try {
    const { geocode } = await import("./geocoding");
    const { calculateNatalChart } = await import("./ephemeris.server");

    const geo = values.selectedLocation
      ? values.selectedLocation
      : await geocode(values.location);

    const chart = await calculateNatalChart({
      name: values.name,
      birthDate: values.birthDate,
      birthTime: values.birthTime || "12:00",
      timezone: geo.timezone,
      displayLocation: geo.displayName,
      lat: geo.lat,
      lng: geo.lng,
      daylightSaving: geo.daylightSaving,
    });

    return { chart, isMock: false, request: values };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Chart calculation error:", message);

    // Return mock data with personalized name
    const mock: NatalChartData = {
      ...mockNatalChart,
      event: {
        ...mockNatalChart.event,
        name: values.name,
        title: `Carta natal de ${values.name}`,
        dateLabel: `${values.birthDate} · ${values.birthTime || "12:00"}`,
        locationLabel: values.location,
      },
    };
    return { chart: mock, isMock: true, error: message, request: values };
  }
}
