"use server";

import { revalidatePath } from "next/cache";

import { isAdminEmail } from "@/lib/admin";
import { getPlanReadingLimit } from "@/lib/reading-limits";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server";

export async function deleteReadingAction(readingId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_authenticated" };
  }

  const isAdmin = isAdminEmail(user.email);
  const deleteClient = isAdmin ? createServiceSupabaseClient() : supabase;
  let deleteQuery = deleteClient
    .from("readings")
    .delete()
    .eq("id", readingId);

  if (!isAdmin) {
    deleteQuery = deleteQuery.eq("user_id", user.id);
  }

  const { error } = await deleteQuery;

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
  const admin = isAdminEmail(user.email);
  const plan = admin ? "avanzado" : profile?.plan === "pro" || profile?.plan === "avanzado" ? profile.plan : "free";
  const limit = admin ? Number.MAX_SAFE_INTEGER : getPlanReadingLimit(plan);

  return { count: count ?? 0, limit, plan };
}
