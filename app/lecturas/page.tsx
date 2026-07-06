import { redirect } from "next/navigation";

import { ReadingsArchiveHeader } from "@/components/readings/readings-archive-header";
import { ReadingUsageSummary } from "@/components/readings/reading-usage-summary";
import { ReadingsList } from "@/components/readings/readings-list";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { isAdminEmail } from "@/lib/admin";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";
import { getEffectivePlan } from "@/lib/plan-access";
import { getPlanReadingLimit } from "@/lib/reading-limits";

type ReadingRow = {
  id: string;
  user_id: string | null;
  type: string | null;
  chart_data: unknown;
  created_at: string;
};

export default async function ReadingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const isAdmin = isAdminEmail(user.email);
  const readingsClient = isAdmin ? createServiceSupabaseClient() : supabase;
  const readingsQuery = readingsClient.from("readings").select("id,user_id,type,chart_data,created_at").order("created_at", { ascending: false });
  const { data: rawReadings } = isAdmin ? await readingsQuery : await readingsQuery.eq("user_id", user.id);
  const readingRows = (rawReadings ?? []) as ReadingRow[];
  const ownerIds = Array.from(new Set(readingRows.map((reading) => reading.user_id).filter(Boolean))) as string[];
  const { data: ownerProfiles } = isAdmin && ownerIds.length
    ? await readingsClient.from("profiles").select("id,email").in("id", ownerIds)
    : { data: [] };
  const ownerEmails = new Map((ownerProfiles ?? []).map((profile) => [profile.id, profile.email]));
  const readings = readingRows.map((reading) => ({
    id: reading.id,
    user_id: reading.user_id,
    type: reading.type,
    chart_data: reading.chart_data,
    created_at: reading.created_at,
    owner_email: reading.user_id ? ownerEmails.get(reading.user_id) ?? null : null,
  }));
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  // Monthly quota is counted from usage events, so deleting an archive item
  // does not refund a reading already generated this month.
  const { count } = await supabase
    .from("reading_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());
  const plan = getEffectivePlan(profile, user);
  const limit = getPlanReadingLimit(plan);

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-5 sm:py-8">
        <Container className="min-h-[100svh] sm:min-h-screen">
          <ReadingsArchiveHeader isAdmin={isAdmin} />

          <div className={isAdmin ? "mx-auto max-w-5xl" : "mx-auto max-w-3xl"}>
            {isAdmin ? (
              <div className="mt-6 border-y border-[#d7e7ff]/18 py-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#d7e7ff]/78">
                  Master view <span className="text-[#f5d782]">{readings.length} readings</span>
                </p>
              </div>
            ) : (
              <ReadingUsageSummary plan={plan} count={count ?? 0} limit={limit} />
            )}
            <ReadingsList readings={readings} isAdmin={isAdmin} />
          </div>
        </Container>
      </section>
    </main>
  );
}
