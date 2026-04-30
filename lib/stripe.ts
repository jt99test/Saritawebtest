import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export const PRICE_MAP = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  avanzado_monthly: process.env.STRIPE_PRICE_AVANZADO_MONTHLY,
  avanzado_yearly: process.env.STRIPE_PRICE_AVANZADO_YEARLY,
  lavado: process.env.STRIPE_PRICE_LAVADO,
} as const;

export type PriceKey = keyof typeof PRICE_MAP;
export type PaidPlan = "pro" | "avanzado";
export type BillingPeriod = "monthly" | "yearly";

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
