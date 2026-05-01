"use client";

import Link from "next/link";
import { useState } from "react";

import { startCheckout } from "@/lib/checkout";
import type { Dictionary } from "@/lib/i18n";
import type { PaidPlan, PriceKey } from "@/lib/stripe";

const PRICES = {
  pro: { monthly: "€14.99", yearly: "€119.99" },
  avanzado: { monthly: "€39.99", yearly: "€299" },
} as const;

type PricingPlansProps = {
  dictionary: Dictionary;
};

const PLAN_IDS = ["free", "pro", "avanzado"] as const;
type PlanId = (typeof PLAN_IDS)[number];

const FEATURE_ACCESS: Record<PlanId, Array<"yes" | "no" | "limited" | "yearly">> = {
  free: ["yes", "limited", "no", "no", "no", "no", "no", "no"],
  pro: ["yes", "yes", "yes", "yes", "no", "no", "no", "yearly"],
  avanzado: ["yes", "yes", "yes", "yes", "yes", "yes", "yes", "yearly"],
};

function accessLabel(value: "yes" | "no" | "limited" | "yearly", dictionary: Dictionary) {
  if (value === "yes") return "✓";
  if (value === "limited") return `✓ ${dictionary.pricing.limited}`;
  if (value === "yearly") return `✓ ${dictionary.pricing.includedYearly}`;
  return dictionary.pricing.notIncluded;
}

export function PricingPlans({ dictionary }: PricingPlansProps) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingKey, setLoadingKey] = useState<PriceKey | null>(null);

  async function checkout(plan: PaidPlan) {
    const key = `${plan}_${period}` as PriceKey;
    setLoadingKey(key);
    try {
      await startCheckout(key);
    } catch {
      window.dispatchEvent(new Event("sarita:open-auth"));
      setLoadingKey(null);
    }
  }

  return (
    <>
      <div className="mx-auto mt-8 inline-flex border border-black/10 bg-black/[0.05] p-1">
        {(["monthly", "yearly"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={[
              "px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] transition",
              period === option ? "bg-dusty-gold/18 text-dusty-gold" : "text-[#3a3048] hover:text-ivory",
            ].join(" ")}
          >
            {option === "monthly" ? dictionary.pricing.monthly : dictionary.pricing.yearly}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PLAN_IDS.map((plan) => {
          const isPaid = plan !== "free";
          const priceKey = isPaid ? (`${plan}_${period}` as PriceKey) : null;
          return (
            <article
              key={plan}
              className={[
                "border p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
                plan === "avanzado"
                  ? "border-dusty-gold/40 bg-dusty-gold/[0.055] shadow-[0_8px_28px_rgba(181,163,110,0.08)]"
                  : "border-black/10 bg-white",
              ].join(" ")}
            >
              <h2 className="font-serif text-4xl text-ivory">
                {plan === "free" ? dictionary.pricing.free : plan === "pro" ? dictionary.paywall.proName : dictionary.paywall.avanzadoName}
              </h2>
              <p className="mt-4 font-serif text-5xl text-ivory">
                {plan === "free" ? "€0" : PRICES[plan][period]}
              </p>
              {isPaid ? (
                <p className="mt-2 text-sm text-[#3a3048]">
                  {period === "monthly" ? dictionary.paywall.perMonth : dictionary.paywall.perYear}
                </p>
              ) : null}
              {isPaid ? (
                <button
                  type="button"
                  disabled={Boolean(loadingKey)}
                  onClick={() => void checkout(plan)}
                  className="mt-7 w-full border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18 disabled:cursor-wait disabled:opacity-50"
                >
                  {loadingKey === priceKey ? dictionary.paywall.checkoutLoading : dictionary.pricing.choose}
                </button>
              ) : (
                <Link
                  href="/form"
                  className="mt-7 block w-full border border-black/10 px-5 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#3a3048] transition hover:border-black/15 hover:text-ivory"
                >
                  {dictionary.pricing.startFree}
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <section className="mt-12 overflow-x-auto border-y border-black/10 py-6">
        <h2 className="font-serif text-3xl text-ivory">{dictionary.pricing.tableTitle}</h2>
        <table className="mt-5 w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-[12px] uppercase tracking-[0.18em] text-[#3a3048]">
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
              <tr key={row} className="border-b border-black/10 last:border-b-0">
                <td className="py-4 pr-4 text-ivory/78">{row}</td>
                {PLAN_IDS.map((plan) => (
                  <td key={plan} className="px-4 py-4 text-center text-[#5c4a24]">
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
