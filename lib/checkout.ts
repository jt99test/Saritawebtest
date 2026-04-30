"use client";

import type { PriceKey } from "@/lib/stripe";

export async function startCheckout(priceKey: PriceKey) {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceKey }),
  });

  if (!response.ok) {
    throw new Error("checkout_failed");
  }

  const { url } = (await response.json()) as { url?: string };

  if (!url) {
    throw new Error("checkout_missing_url");
  }

  window.location.assign(url);
}
