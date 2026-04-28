import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountButton } from "@/components/auth/account-button";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { ReadingsList } from "@/components/readings/readings-list";
import { ReadingUsageSummary } from "@/components/readings/reading-usage-summary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("readings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());
  const plan = profile?.plan ?? "free";
  const limit = plan === "completo" ? 50 : plan === "basico" ? 10 : 2;

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-6 sm:py-8">
        <Container className="min-h-screen">
          <div className="mx-auto mb-10 flex max-w-3xl items-center justify-between gap-4 border-b border-white/8 pb-4">
            <Link
              href="/resultado"
              className="text-xs font-medium uppercase tracking-[0.24em] text-ivory/58 transition hover:text-ivory"
            >
              ← volver
            </Link>
            <AccountButton />
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-dusty-gold/58">
                  archivo personal
                </p>
                <h1 className="font-serif text-[48px] font-normal leading-none text-ivory">
                  Lecturas guardadas
                </h1>
              </div>
              <Link
                href="/form"
                className="border-t border-dusty-gold/18 pt-3 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/78 transition hover:text-dusty-gold sm:min-w-[190px] sm:text-right"
              >
                Generar nueva lectura
              </Link>
            </div>
            <ReadingUsageSummary plan={plan} count={count ?? 0} limit={limit} />

            <ReadingsList readings={readings ?? []} />
          </div>
        </Container>
      </section>
    </main>
  );
}
