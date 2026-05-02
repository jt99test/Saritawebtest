"use server";

import { revalidatePath } from "next/cache";

import { getPlanReadingLimit } from "@/lib/reading-limits";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function deleteReadingAction(readingId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_authenticated" };
  }

  const { error } = await supabase
    .from("readings")
    .delete()
    .eq("id", readingId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/lecturas");
  return { ok: true };
}

export async function getReadingUsageAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { count: 0, limit: getPlanReadingLimit("free"), plan: "free" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("reading_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth.toISOString());
  const plan = profile?.plan === "pro" || profile?.plan === "avanzado" ? profile.plan : "free";
  const limit = getPlanReadingLimit(plan);

  return { count: count ?? 0, limit, plan };
}
