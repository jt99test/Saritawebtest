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
};

export const CHART_DRAFT_KEY = "sarita_chart_draft";
export const CHART_RESULT_KEY = "sarita_chart";
