"use client";

import { useEffect, useState } from "react";

import { getCurrentPlanAction } from "@/app/plan/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { BillingPeriod, PaidPlan } from "@/lib/billing";

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

      const data = await getCurrentPlanAction();

      if (!cancelled) {
        setState({
          plan: data.plan,
          billing_period: data.billing_period,
          lavado_purchased: data.lavado_purchased,
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
