"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { BillingPeriod, PaidPlan } from "@/lib/stripe";

type PlanState = {
  plan: "free" | PaidPlan;
  billing_period: BillingPeriod | null;
  lavado_purchased: boolean;
  loading: boolean;
};

const DEFAULT_PLAN: PlanState = {
  plan: "free",
  billing_period: null,
  lavado_purchased: false,
  loading: true,
};

export function usePlan() {
  const [state, setState] = useState<PlanState>(DEFAULT_PLAN);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserSupabaseClient();

    async function loadPlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setState({ ...DEFAULT_PLAN, loading: false });
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("plan,billing_period,lavado_purchased")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setState({
          plan: data?.plan === "pro" || data?.plan === "avanzado" ? data.plan : "free",
          billing_period: data?.billing_period === "monthly" || data?.billing_period === "yearly" ? data.billing_period : null,
          lavado_purchased: Boolean(data?.lavado_purchased),
          loading: false,
        });
      }
    }

    void loadPlan();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadPlan();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
