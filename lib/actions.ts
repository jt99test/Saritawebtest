"use server";

import type { NatalChartData } from "./chart";
import { mockNatalChart } from "./chart";
import type { ChartActionResult, ChartCalculationResult, FormValues } from "./chart-session";
import { createServerSupabaseClient } from "./supabase/server";

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  basico: 10,
  completo: 50,
};

function getStartOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function getReadingAccess() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  const plan = profile?.plan ?? "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const { count } = await supabase
    .from("readings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", getStartOfMonth());

  return {
    supabase,
    user,
    plan,
    limit,
    count: count ?? 0,
  };
}

type ReadingAccess = NonNullable<Awaited<ReturnType<typeof getReadingAccess>>>;

async function saveNatalReading(result: ChartCalculationResult, access: ReadingAccess) {
  const { data, error } = await access.supabase
    .from("readings")
    .insert({
      user_id: access.user.id,
      type: "natal",
      chart_data: result,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Reading save error:", error.message);
  }

  result.readingId = data?.id;
  result.saved = Boolean(data?.id);
  result.usage = {
    count: access.count + 1,
    limit: access.limit,
    plan: access.plan,
  };
}

export async function calculateChartAction(values: FormValues): Promise<ChartActionResult> {
  const access = await getReadingAccess();

  if (access && access.count >= access.limit) {
    return {
      limitReached: true,
      error: "limit_reached",
      plan: access.plan,
      count: access.count,
      limit: access.limit,
    };
  }

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

    const result: ChartCalculationResult = {
      chart,
      isMock: false,
      request: values,
    };

    if (access) {
      await saveNatalReading(result, access);
    }

    return result;
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
    const result: ChartCalculationResult = {
      chart: mock,
      isMock: true,
      error: message,
      request: values,
    };

    if (access) {
      await saveNatalReading(result, access);
    }

    return result;
  }
}
