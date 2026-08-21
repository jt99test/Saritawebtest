"use client";

import { useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { Dictionary } from "@/lib/i18n";
import { PLAN_LIMITS } from "@/lib/reading-limits";
import { whatsappLink } from "@/lib/whatsapp";

const PRICES = {
  pro: { monthly: "€14.99", yearly: "€119" },
  avanzado: { monthly: "€39.99", yearly: "€299" },
} as const;

type PricingPlansProps = {
  dictionary: Dictionary;
};

const PLAN_IDS = ["free", "pro", "avanzado"] as const;
type PlanId = (typeof PLAN_IDS)[number];
type FeatureAccess = "yes" | "no" | "limited" | "yearly" | string;

const FEATURE_ACCESS: Record<PlanId, FeatureAccess[]> = {
  free: [`${PLAN_LIMITS.free}`, "yes", "limited", "no", "no", "no", "no", "no", "no", "no"],
  pro: [`${PLAN_LIMITS.pro}`, "yes", "yes", "yes", "yes", "no", "no", "no", "no", "yearly"],
  avanzado: [`${PLAN_LIMITS.avanzado}`, "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yes", "yearly"],
};

function accessLabel(value: FeatureAccess, dictionary: Dictionary) {
  if (value === "yes") return "✓";
  if (value === "limited") return `✓ ${dictionary.pricing.limited}`;
  if (value === "yearly") return `✓ ${dictionary.pricing.includedYearly}`;
  if (/^\d+$/.test(value)) return dictionary.pricing.readingsPerMonth.replace("{count}", value);
  return dictionary.pricing.notIncluded;
}

export function PricingPlans({ dictionary }: PricingPlansProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");

  function whatsappHref(plan: "pro" | "avanzado") {
    const planName = plan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName;
    const periodName = period === "monthly" ? dictionary.pricing.monthly : dictionary.pricing.yearly;
    return whatsappLink(
      dictionary.paywall.whatsappPlanMessage.replace("{plan}", planName).replace("{period}", periodName),
    );
  }

  return (
    <>
      <div className="mx-auto mt-7 inline-flex border border-[#d7e7ff]/16 bg-[#030814]/44 p-1 shadow-[0_0_22px_rgba(0,102,255,0.1)] sm:mt-8">
        {(["monthly", "yearly"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={[
                "px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition sm:px-5 sm:text-[12px] sm:tracking-[0.2em]",
              period === option ? "bg-[#f5d782]/18 text-[#f5d782]" : "text-[#d7e7ff]/72 hover:text-[#fffaf0]",
            ].join(" ")}
          >
            {option === "monthly" ? dictionary.pricing.monthly : dictionary.pricing.yearly}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-3">
        {PLAN_IDS.map((plan) => {
          const isPaid = plan !== "free";
          return (
            <article
              key={plan}
              className={[
                "flex flex-col border p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2)] sm:p-6",
                plan === "avanzado"
                  ? "border-[#f5d782]/42 bg-[#f5d782]/[0.06] shadow-[0_8px_28px_rgba(245,215,130,0.1)]"
                  : "border-[#d7e7ff]/14 bg-[#061331]/82",
              ].join(" ")}
            >
              <h2 className="font-serif text-3xl text-ivory sm:text-4xl">
                {plan === "free" ? dictionary.pricing.free : plan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName}
              </h2>
              <p className="mt-3 font-serif text-4xl text-ivory sm:mt-4 sm:text-5xl">
                {plan === "free" ? "€0" : PRICES[plan][period]}
              </p>
              {isPaid ? (
                <p className="mt-2 text-sm text-[#d7e7ff]/72">
                  {period === "monthly" ? dictionary.paywall.perMonth : dictionary.paywall.perYear}
                </p>
              ) : null}
              <div className="mt-7 flex grow flex-col justify-end">
                {isPaid ? (
                  <PrimaryButton
                    href={whatsappHref(plan)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghostGold"
                    className="flex w-full px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
                  >
                    {dictionary.paywall.whatsappCta}
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    href="/form"
                    variant="ghostGold"
                    className="flex w-full px-5 py-3 text-[12px] uppercase tracking-[0.2em]"
                  >
                    {dictionary.pricing.startFree}
                  </PrimaryButton>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10 overflow-x-auto border-y border-black/10 py-5 sm:mt-12 sm:py-6">
        <h2 className="font-serif text-2xl text-ivory sm:text-3xl">{dictionary.pricing.tableTitle}</h2>
        <table className="mt-5 w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#d7e7ff]/14 text-left text-[12px] uppercase tracking-[0.18em] text-[#d7e7ff]/66">
              <th className="py-3 pr-4">{dictionary.result.completeChart.columns[1]}</th>
              {PLAN_IDS.map((plan) => (
                <th key={plan} className="px-4 py-3 text-center">
                  {plan === "free" ? dictionary.pricing.free : plan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dictionary.pricing.rows.map((row, rowIndex) => (
              <tr key={row} className="border-b border-[#d7e7ff]/12 last:border-b-0">
                <td className="py-4 pr-4 text-ivory/78">{row}</td>
                {PLAN_IDS.map((plan) => (
                  <td key={plan} className="px-4 py-4 text-center text-[#f5d782]">
                    {accessLabel(FEATURE_ACCESS[plan][rowIndex], dictionary)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
