"use client";

import type { PriceKey } from "@/lib/billing";

export class CheckoutError extends Error {
  status: number;

  constructor(status: number, message = "checkout_failed") {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

export async function startCheckout(priceKey: PriceKey) {
  const endpoint = "/api/whop/checkout";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceKey }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "checkout_failed");
    throw new CheckoutError(response.status, message || "checkout_failed");
  }

  const { url } = (await response.json()) as { url?: string };

  if (!url) {
    throw new CheckoutError(500, "checkout_missing_url");
  }

  window.location.assign(url);
}
