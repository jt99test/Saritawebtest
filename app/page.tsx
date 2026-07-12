import { HomePage } from "@/components/home/home-page";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentMoonStatus } from "@/lib/lunar.server";
import type { ChartCalculationResult } from "@/lib/chart-session";

type LatestReading = {
  id: string;
  name: string;
  type: string | null;
  created_at: string;
  chart_data: ChartCalculationResult;
};

function getLatestReadingFromRow(row: {
  id: string;
  type: string | null;
  created_at: string;
  chart_data: unknown;
}): LatestReading | null {
  const data = row.chart_data as Partial<ChartCalculationResult> | null;
  const chartName = data?.chart?.event?.name;

  if (!data?.chart || !data.request || typeof data.isMock !== "boolean" || typeof chartName !== "string") {
    return null;
  }

  return {
    id: row.id,
    name: chartName,
    type: row.type,
    created_at: row.created_at,
    chart_data: {
      ...data,
      readingId: data.readingId ?? row.id,
      saved: data.saved ?? true,
    } as ChartCalculationResult,
  };
}

async function getLatestReading() {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error } = await supabase.auth.getUser();

  if (error || !authData.user) {
    return null;
  }

  const { data } = await supabase
    .from("readings")
    .select("id,type,chart_data,created_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? getLatestReadingFromRow(data) : null;
}

export default async function Home() {
  const [moonStatus, latestReading] = await Promise.all([
    getCurrentMoonStatus(),
    getLatestReading(),
  ]);

  return <HomePage moonStatus={moonStatus} latestReading={latestReading} />;
}
