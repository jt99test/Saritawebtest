"use client";

import { useState } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { showNotice } from "@/components/ui/notice-provider";
import { CheckoutError, startCheckout } from "@/lib/checkout";
import { dictionaries } from "@/lib/i18n";
import type { PaidPlan, PriceKey } from "@/lib/billing";

type PricingModalProps = {
  open: boolean;
  onClose: () => void;
  requiredPlan: PaidPlan;
};

const PRICES = {
  pro: { monthly: "\u20ac14.99", yearly: "\u20ac119", saving: "60" },
  avanzado: { monthly: "\u20ac39.99", yearly: "\u20ac299", saving: "180" },
} as const;

export function PricingModal({ open, onClose, requiredPlan }: PricingModalProps) {
  const locale = useStoredLocale();
  const dictionary = dictionaries[locale];
  const copy = dictionary.paywall;
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loadingKey, setLoadingKey] = useState<PriceKey | null>(null);

  if (!open) {
    return null;
  }

  async function handleCheckout(plan: PaidPlan) {
    const key = `${plan}_${period}` as PriceKey;
    setLoadingKey(key);

    try {
      await startCheckout(key);
    } catch (error) {
      if (error instanceof CheckoutError && error.status === 401) {
        window.dispatchEvent(new Event("sarita:open-auth"));
      } else {
        showNotice({
          message: "No pude abrir el checkout. Revisa la configuracion de Whop o intenta otra vez.",
          tone: "error",
        });
      }
      setLoadingKey(null);
    }
  }

  const plans: Array<{ id: PaidPlan; name: string; features: string[] }> = [
    { id: "pro", name: copy.proName, features: copy.proFeatures },
    { id: "avanzado", name: copy.avanzadoName, features: copy.avanzadoFeatures },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#030814]/78 px-4 py-8 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,102,255,0.28),transparent_46%),radial-gradient(circle_at_80%_12%,rgba(245,215,130,0.16),transparent_28%)]" />
      <div className="relative mx-auto max-w-5xl border border-[#f5d782]/30 bg-[#071437]/94 px-5 py-6 text-[#d7e7ff] shadow-[0_28px_90px_rgba(0,0,0,0.38),0_0_44px_rgba(0,102,255,0.16)] sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-4 border-b border-[#d7e7ff]/14 pb-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]">
              {copy.lockedTabCta}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-tight text-[#fffaf0] sm:text-[48px]">
              {copy.lockedTabTitle.replace("{plan}", requiredPlan === "pro" ? copy.proName : copy.avanzadoName)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-[#d7e7ff]/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d7e7ff] transition hover:border-[#f5d782]/45 hover:text-[#f5d782]"
          >
            {dictionary.common.close}
          </button>
        </div>

        <div className="mt-6 inline-flex border border-[#d7e7ff]/16 bg-[#030814]/45 p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={[
                "px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] transition",
                period === option ? "bg-[#f5d782]/18 text-[#f5d782]" : "text-[#d7e7ff]/72 hover:text-[#fffaf0]",
              ].join(" ")}
            >
              {option === "monthly" ? copy.monthly : copy.yearly}
            </button>
          ))}
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {plans.map((plan) => {
            const price = PRICES[plan.id][period];
            const priceKey = `${plan.id}_${period}` as PriceKey;
            const highlighted = requiredPlan === plan.id;
            const loading = loadingKey === priceKey;

            return (
              <article
                key={plan.id}
                className={[
                  "border p-6 shadow-[0_12px_36px_rgba(0,0,0,0.24)]",
                  highlighted
                    ? "border-[#f5d782]/50 bg-[#f5d782]/[0.06] ring-1 ring-[#f5d782]/24"
                    : "border-[#d7e7ff]/14 bg-[#061331]/82",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-4xl text-[#fffaf0]">{plan.name}</h3>
                    <p className="mt-1 text-sm text-[#d7e7ff]/72">
                      {plan.id === "pro" ? copy.proTagline : copy.avanzadoTagline}
                    </p>
                    {plan.id === "avanzado" ? (
                      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#f5d782]">
                        {copy.mostPopular}
                      </p>
                    ) : null}
                  </div>
                  {period === "yearly" ? (
                    <span className="border border-[#f5d782]/24 bg-[#f5d782]/8 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#f5d782]">
                      {copy.savesBadge.replace("{amount}", PRICES[plan.id].saving)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <span className="font-serif text-5xl text-[#fffaf0]">{price}</span>
                  <span className="ml-2 text-sm text-[#d7e7ff]/72">{period === "monthly" ? copy.perMonth : copy.perYear}</span>
                  {period === "yearly" ? <p className="mt-2 text-sm text-[#d7e7ff]/72">{copy.billedYearly}</p> : null}
                </div>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-6 text-[#d7e7ff]/76">
                      <span className="mt-0.5 shrink-0 text-base text-[#f5d782]">{"\u2713"}</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {period === "yearly" ? (
                  <p className="mt-6 border-y border-[#f5d782]/16 py-3 text-sm text-[#f5d782]">
                    {copy.lavadoFreeHighlight}
                  </p>
                ) : null}

                <PrimaryButton
                  type="button"
                  className="mt-7 w-full"
                  disabled={Boolean(loadingKey)}
                  onClick={() => void handleCheckout(plan.id)}
                >
                  {loading ? copy.checkoutLoading : copy.upgrade}
                </PrimaryButton>
                <p className="mt-3 text-center text-[12px] uppercase tracking-[0.16em] text-[#d7e7ff]/62">
                  {copy.cancelAnytime}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
