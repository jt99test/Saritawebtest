"use server";

import { getEffectivePlan } from "@/lib/plan-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentPlanAction() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      plan: "free" as const,
      billing_period: null,
      lavado_purchased: false,
    };
  }

  const { data } = await supabase
    .from("profiles")
    .select("plan,billing_period,lavado_purchased")
    .eq("id", user.id)
    .maybeSingle();

  return {
    plan: getEffectivePlan(data, user),
    billing_period: data?.billing_period === "monthly" || data?.billing_period === "yearly" ? data.billing_period : null,
    lavado_purchased: Boolean(data?.lavado_purchased),
  };
}
