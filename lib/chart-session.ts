import type { NatalChartData } from "@/lib/chart";
import { safeRemoveStorageItem } from "@/lib/browser-storage";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { ReadingGender } from "@/lib/reading-gender";

export type FormValues = {
  name: string;
  firstName?: string;
  lastName?: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown?: boolean;
  gender?: ReadingGender | "";
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

export type ChartAuthRequiredResult = {
  authRequired: true;
  error: "not_authenticated";
};

export type ChartActionResult = ChartCalculationResult | ChartLimitReachedResult | ChartAuthRequiredResult;

export const CHART_DRAFT_KEY = "sarita_chart_draft";
export const CHART_RESULT_KEY = "sarita_chart";

export function clearChartSession() {
  if (typeof window === "undefined") {
    return;
  }

  safeRemoveStorageItem("session", CHART_DRAFT_KEY);
  safeRemoveStorageItem("session", CHART_RESULT_KEY);
}
