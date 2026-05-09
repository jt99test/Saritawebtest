"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { PricingModal } from "@/components/paywall/pricing-modal";
import type { Dictionary } from "@/lib/i18n";
import { usePlan } from "@/lib/use-plan";

type PaidFeatureGateProps = {
  dictionary: Dictionary;
  featureName: string;
  children: ReactNode;
};

export function PaidFeatureGate({ dictionary, featureName, children }: PaidFeatureGateProps) {
  const { plan, loading } = usePlan();
  const [pricingOpen, setPricingOpen] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto mt-16 max-w-2xl border-y border-dusty-gold/14 py-14 text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {featureName}
        </p>
      </div>
    );
  }

  if (plan !== "free") {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto mt-16 max-w-2xl border-y border-dusty-gold/14 py-14 text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {featureName}
        </p>
        <h2 className="mt-3 font-serif text-[32px] leading-tight text-ivory sm:text-[38px]">
          {dictionary.paywall.lockedTabTitle.replace("{plan}", dictionary.paywall.proName)}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#3a3048]">
          {dictionary.paywall.lockedTabBody.replace("{plan}", dictionary.paywall.proName)}
        </p>
        <button
          type="button"
          onClick={() => setPricingOpen(true)}
          className="mt-8 border border-dusty-gold/32 bg-dusty-gold/10 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5c4a24] transition hover:border-dusty-gold/55 hover:bg-dusty-gold/16"
        >
          {dictionary.paywall.lockedTabCta}
        </button>
      </div>
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} requiredPlan="pro" />
    </>
  );
}
