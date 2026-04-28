import type { NatalChartData } from "@/lib/chart";
import type { PlaceSuggestion } from "@/lib/geocoding";

export type FormValues = {
  name: string;
  birthDate: string;
  birthTime: string;
  location: string;
  selectedLocation: PlaceSuggestion | null;
};

export type ChartCalculationResult = {
  chart: NatalChartData;
  isMock: boolean;
  error?: string;
  request: FormValues;
  readingId?: string;
  saved?: boolean;
  usage?: {
    count: number;
    limit: number;
    plan: string;
  };
};

export type ChartLimitReachedResult = {
  limitReached: true;
  error: "limit_reached";
  plan: string;
  count: number;
  limit: number;
};

export type ChartActionResult = ChartCalculationResult | ChartLimitReachedResult;

export const CHART_DRAFT_KEY = "sarita_chart_draft";
export const CHART_RESULT_KEY = "sarita_chart";

export function clearChartSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(CHART_DRAFT_KEY);
  window.sessionStorage.removeItem(CHART_RESULT_KEY);
}
