import type { ReactNode } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { Dictionary } from "@/lib/i18n";

type PlanGateProps = {
  plan: string;
  featureName: string;
  dictionary: Dictionary;
  children: ReactNode;
};

export function PlanGate({ plan, featureName, dictionary, children }: PlanGateProps) {
  if (plan !== "free") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto mt-12 max-w-2xl border-y border-dusty-gold/14 py-14 text-center">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {dictionary.result.planGate.eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-[42px] font-normal leading-tight text-ivory lg:text-[56px]">
        {dictionary.result.planGate.title.replace("{featureName}", featureName)}
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#3a3048]">
        {dictionary.result.planGate.description}
      </p>
      <PrimaryButton href="/#planes" className="mt-8 px-6 py-3 text-[12px] uppercase tracking-[0.2em]">
        {dictionary.result.planGate.cta}
      </PrimaryButton>
    </div>
  );
}
