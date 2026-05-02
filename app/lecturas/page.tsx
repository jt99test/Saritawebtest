import { redirect } from "next/navigation";

import { ReadingsArchiveHeader } from "@/components/readings/readings-archive-header";
import { ReadingUsageSummary } from "@/components/readings/reading-usage-summary";
import { ReadingsList } from "@/components/readings/readings-list";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlanReadingLimit } from "@/lib/reading-limits";

export default async function ReadingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  const { data: readings } = await supabase
    .from("readings")
    .select("id,type,chart_data,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
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
  const plan = profile?.plan ?? "free";
  const limit = getPlanReadingLimit(plan);

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-6 sm:py-8">
        <Container className="min-h-screen">
          <ReadingsArchiveHeader />

          <div className="mx-auto max-w-3xl">
            <ReadingUsageSummary plan={plan} count={count ?? 0} limit={limit} />
            <ReadingsList readings={readings ?? []} />
          </div>
        </Container>
      </section>
    </main>
  );
}
