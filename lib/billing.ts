export type PaidPlan = "pro" | "avanzado";
export type BillingPeriod = "monthly" | "yearly";
export type SubscriptionPriceKey = `${PaidPlan}_${BillingPeriod}`;
export type PriceKey = SubscriptionPriceKey | "lavado";

export function planFromPriceKey(priceKey: SubscriptionPriceKey): { plan: PaidPlan; billing_period: BillingPeriod } {
  const [plan, billingPeriod] = priceKey.split("_") as [PaidPlan, BillingPeriod];
  return { plan, billing_period: billingPeriod };
}

export function isSubscriptionPriceKey(value: unknown): value is SubscriptionPriceKey {
  return (
    value === "pro_monthly" ||
    value === "pro_yearly" ||
    value === "avanzado_monthly" ||
    value === "avanzado_yearly"
  );
}

export function isPriceKey(value: unknown): value is PriceKey {
  return isSubscriptionPriceKey(value) || value === "lavado";
}
