import Stripe from "stripe";

import type { BillingPeriod, PaidPlan, PriceKey } from "@/lib/billing";

export type { BillingPeriod, PaidPlan, PriceKey } from "@/lib/billing";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(stripeSecretKey);

export const PRICE_MAP = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  avanzado_monthly: process.env.STRIPE_PRICE_AVANZADO_MONTHLY,
  avanzado_yearly: process.env.STRIPE_PRICE_AVANZADO_YEARLY,
  lavado: process.env.STRIPE_PRICE_LAVADO,
} as const satisfies Record<PriceKey, string | undefined>;

export function planFromPriceId(priceId: string): { plan: PaidPlan; billing_period: BillingPeriod } | null {
  if (priceId === PRICE_MAP.pro_monthly) {
    return { plan: "pro", billing_period: "monthly" };
  }

  if (priceId === PRICE_MAP.pro_yearly) {
    return { plan: "pro", billing_period: "yearly" };
  }

  if (priceId === PRICE_MAP.avanzado_monthly) {
    return { plan: "avanzado", billing_period: "monthly" };
  }

  if (priceId === PRICE_MAP.avanzado_yearly) {
    return { plan: "avanzado", billing_period: "yearly" };
  }

  return null;
}
