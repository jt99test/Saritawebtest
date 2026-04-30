"use server";

import type { NatalChartData } from "./chart";
import { mockNatalChart } from "./chart";
import type { ChartActionResult, ChartCalculationResult, FormValues } from "./chart-session";
import type { PlaceSuggestion } from "./geocoding";
import { createServerSupabaseClient } from "./supabase/server";

const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  basico: 10,
  completo: 50,
  pro: 10,
  avanzado: 50,
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
  // Usage is counted from immutable usage events so deleting an archived reading
  // does not refund the monthly quota that was already spent.
  const { count } = await supabase
    .from("reading_usage_events")
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
export type HouseSystemCode = "P" | "W" | "K" | "E";

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

  if (data?.id) {
    const { error: usageError } = await access.supabase
      .from("reading_usage_events")
      .insert({
        user_id: access.user.id,
        reading_id: data.id,
        type: "natal",
      });

    if (usageError) {
      console.error("Reading usage event error:", usageError.message);
    }
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

export async function recalculateHouseSystemAction(
  values: FormValues,
  houseSystem: HouseSystemCode,
): Promise<NatalChartData> {
  const { geocode } = await import("./geocoding");
  const { calculateNatalChart } = await import("./ephemeris.server");
  const geo = values.selectedLocation ? values.selectedLocation : await geocode(values.location);

  return calculateNatalChart({
    name: values.name,
    birthDate: values.birthDate,
    birthTime: values.birthTime || "12:00",
    timezone: geo.timezone,
    displayLocation: geo.displayName,
    lat: geo.lat,
    lng: geo.lng,
    daylightSaving: geo.daylightSaving,
    houseSystem,
  });
}

export async function calculateCurrentTransitsAction(
  natalChart: NatalChartData,
  values: FormValues | null,
) {
  const access = await getReadingAccess();
  if (!access || access.plan !== "avanzado") {
    return { ok: false as const, error: "advanced_plan_required" };
  }

  if (!values) {
    return { ok: false as const, error: "missing_original_request" };
  }

  const { DateTime } = await import("luxon");
  const { geocode } = await import("./geocoding");
  const { calculateNatalChart } = await import("./ephemeris.server");
  const { getActiveTransits } = await import("./transits.server");
  const geo = values.selectedLocation ? values.selectedLocation : await geocode(values.location);
  const now = new Date();
  const localNow = DateTime.fromJSDate(now).setZone(geo.timezone);

  const chart = await calculateNatalChart({
    name: "Tránsitos",
    birthDate: localNow.toISODate() ?? localNow.toFormat("yyyy-MM-dd"),
    birthTime: localNow.toFormat("HH:mm"),
    timezone: geo.timezone,
    displayLocation: geo.displayName,
    lat: geo.lat,
    lng: geo.lng,
    daylightSaving: geo.daylightSaving,
  });

  chart.event.name = "Tránsitos";
  chart.event.title = "Planetas en tránsito ahora";

  return {
    ok: true as const,
    chart,
    transits: await getActiveTransits(natalChart, now),
    generatedAt: now.toISOString(),
  };
}

export async function calculateSolarReturnAction(input: {
  natalChart: NatalChartData;
  request?: FormValues | null;
  targetYear: number;
  city?: string;
  lat?: number;
  lng?: number;
}) {
  const access = await getReadingAccess();
  if (!access || access.plan !== "avanzado") {
    return { ok: false as const, error: "advanced_plan_required" };
  }

  const { calculateSolarReturn } = await import("./ephemeris.server");
  const sun = input.natalChart.points.find((point) => point.id === "sun");

  if (!sun) {
    return { ok: false as const, error: "missing_sun" };
  }

  const year = Math.max(1901, Math.min(2100, input.targetYear));
  const lat = input.lat ?? Number(input.natalChart.event.latitude.match(/[\d.]+/)?.[0] ?? 0);
  const lng = input.lng ?? Number(input.natalChart.event.longitude.match(/[\d.]+/)?.[0] ?? 0);
  const [birthYear, birthMonth, birthDay] = (input.request?.birthDate ?? "")
    .split("-")
    .map((part) => Number(part));
  const chart = await calculateSolarReturn(
    sun.longitude,
    year,
    lat,
    lng,
    birthMonth || 6,
    birthDay || 30,
  );

  chart.event.name = input.natalChart.event.name;
  chart.event.title = `Revolución Solar ${year}`;
  chart.event.locationLabel = input.city ?? input.natalChart.event.locationLabel;
  chart.meta.solarReturnYear = year;

  if (access) {
    const { data, error } = await access.supabase
      .from("readings")
      .insert({
        user_id: access.user.id,
        type: "solar_return",
        chart_data: {
          chart,
          natalChartId: input.natalChart.event.julianDay,
          targetYear: year,
          birthYear,
        },
      })
      .select("id")
      .single();

    if (!error && data?.id) {
      await access.supabase.from("reading_usage_events").insert({
        user_id: access.user.id,
        reading_id: data.id,
        type: "solar_return",
      });
    }
  }

  return { ok: true as const, chart };
}

export type SynastryPartnerInput = {
  name: string;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  selectedLocation: PlaceSuggestion | null;
};

export async function getSynastryPartnersAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("synastry_partners")
    .select("id,name,birth_date,birth_time,birth_city,birth_lat,birth_lng,chart_data,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function saveAndCalculateSynastryPartnerAction(input: SynastryPartnerInput) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "not_authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.plan !== "avanzado") {
    return { ok: false as const, error: "advanced_plan_required" };
  }

  const { geocode } = await import("./geocoding");
  const { calculateNatalChart } = await import("./ephemeris.server");
  const geo = input.selectedLocation ?? await geocode(input.birthCity);
  const chart = await calculateNatalChart({
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime || "12:00",
    timezone: geo.timezone,
    displayLocation: geo.displayName,
    lat: geo.lat,
    lng: geo.lng,
    daylightSaving: geo.daylightSaving,
  });

  const { data, error } = await supabase
    .from("synastry_partners")
    .insert({
      user_id: user.id,
      name: input.name,
      birth_date: input.birthDate,
      birth_time: input.birthTime || "12:00",
      birth_city: geo.displayName,
      birth_lat: geo.lat,
      birth_lng: geo.lng,
      chart_data: chart,
    })
    .select("id,name,birth_date,birth_time,birth_city,birth_lat,birth_lng,chart_data,created_at")
    .single();

  if (error) {
    return { ok: false as const, error: error.message, chart };
  }

  return { ok: true as const, partner: data, chart };
}

export async function deleteSynastryPartnerAction(partnerId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "not_authenticated" };
  }

  const { error } = await supabase
    .from("synastry_partners")
    .delete()
    .eq("id", partnerId)
    .eq("user_id", user.id);

  return { ok: !error, error: error?.message };
}
