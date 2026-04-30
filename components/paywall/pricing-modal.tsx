"use client";

import { useState } from "react";

import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import { PrimaryButton } from "@/components/ui/primary-button";
import { startCheckout } from "@/lib/checkout";
import { dictionaries } from "@/lib/i18n";
import type { PaidPlan, PriceKey } from "@/lib/stripe";

type PricingModalProps = {
  open: boolean;
  onClose: () => void;
  requiredPlan: PaidPlan;
};

const PRICES = {
  pro: { monthly: "€14.99", yearly: "€119.99", saving: "60" },
  avanzado: { monthly: "€39.99", yearly: "€299", saving: "180" },
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
    } catch {
      setLoadingKey(null);
    }
  }

  const plans: Array<{ id: PaidPlan; name: string; features: string[] }> = [
    { id: "pro", name: copy.proName, features: copy.proFeatures },
    { id: "avanzado", name: copy.avanzadoName, features: copy.avanzadoFeatures },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cosmic-950/92 px-4 py-8 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(181,163,110,0.12),transparent_42%)]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-dusty-gold/72">
              {copy.lockedTabCta}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-tight text-ivory sm:text-[48px]">
              {copy.lockedTabTitle.replace("{plan}", requiredPlan === "pro" ? copy.proName : copy.avanzadoName)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/62 transition hover:border-white/20 hover:text-ivory"
          >
            {dictionary.common.close}
          </button>
        </div>

        <div className="mt-6 inline-flex border border-white/10 bg-black/25 p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={[
                "px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.2em] transition",
                period === option ? "bg-dusty-gold/18 text-dusty-gold" : "text-ivory/52 hover:text-ivory",
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
                  "border bg-white/[0.025] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]",
                  highlighted ? "border-dusty-gold/55" : "border-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-4xl text-ivory">{plan.name}</h3>
                    {plan.id === "avanzado" ? (
                      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold/78">
                        {copy.mostPopular}
                      </p>
                    ) : null}
                  </div>
                  {period === "yearly" ? (
                    <span className="border border-dusty-gold/24 bg-dusty-gold/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-dusty-gold/82">
                      {copy.savesBadge.replace("{amount}", PRICES[plan.id].saving)}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <span className="font-serif text-5xl text-ivory">{price}</span>
                  <span className="ml-2 text-sm text-ivory/48">{period === "monthly" ? copy.perMonth : copy.perYear}</span>
                  {period === "yearly" ? <p className="mt-2 text-sm text-ivory/42">{copy.billedYearly}</p> : null}
                </div>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-6 text-ivory/72">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-dusty-gold/80" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {period === "yearly" ? (
                  <p className="mt-6 border-y border-dusty-gold/16 py-3 text-sm text-dusty-gold/82">
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
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
