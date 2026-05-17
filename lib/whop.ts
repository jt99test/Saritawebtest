import { Whop } from "@whop/sdk";

import {
  isPriceKey,
  isSubscriptionPriceKey,
  planFromPriceKey,
  type PriceKey,
} from "@/lib/billing";

const whopApiKey = process.env.WHOP_API_KEY;
const whopWebhookSecret = process.env.WHOP_WEBHOOK_SECRET;

export const WHOP_PRODUCT_MAP: Record<PriceKey, string | undefined> = {
  pro_monthly: process.env.WHOP_PRO_MONTHLY_PRODUCT_ID,
  pro_yearly: process.env.WHOP_PRO_YEARLY_PRODUCT_ID,
  avanzado_monthly: process.env.WHOP_AVANZADO_MONTHLY_PRODUCT_ID,
  avanzado_yearly: process.env.WHOP_AVANZADO_YEARLY_PRODUCT_ID,
  lavado: process.env.WHOP_LAVADO_PRODUCT_ID,
};

export function getWhopClient() {
  if (!whopApiKey) {
    throw new Error("WHOP_API_KEY is not configured");
  }

  return new Whop({
    apiKey: whopApiKey,
    webhookKey: whopWebhookSecret ? Buffer.from(whopWebhookSecret).toString("base64") : undefined,
  });
}

export function getWhopProductForPriceKey(priceKey: PriceKey) {
  const productId = WHOP_PRODUCT_MAP[priceKey];

  if (!productId) {
    throw new Error(`Whop product is not configured for ${priceKey}`);
  }

  return productId;
}

export function priceKeyFromWhopProductId(productId: string | null | undefined) {
  if (!productId) return null;
  const entry = Object.entries(WHOP_PRODUCT_MAP).find(([, configuredProductId]) => configuredProductId === productId);
  const priceKey = entry?.[0];
  return isPriceKey(priceKey) ? priceKey : null;
}

export function planFromWhopProductId(productId: string | null | undefined) {
  const priceKey = priceKeyFromWhopProductId(productId);
  return isSubscriptionPriceKey(priceKey) ? planFromPriceKey(priceKey) : null;
}

export function whopPurchaseUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `https://whop.com${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function dateFromWhopTimestamp(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isFinite(numericValue)) {
    return new Date(numericValue * 1000).toISOString();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}
