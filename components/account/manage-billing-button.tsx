"use client";

import { useState } from "react";

import type { Dictionary } from "@/lib/i18n";

export function ManageBillingButton({ dictionary }: { dictionary: Dictionary }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const response = await fetch("/api/stripe/portal", { method: "POST" }).catch(() => null);
    if (!response?.ok) {
      setLoading(false);
      return;
    }
    const { url } = (await response.json()) as { url?: string };
    if (url) {
      window.location.assign(url);
      return;
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={() => void openPortal()}
      disabled={loading}
      className="mt-6 border border-dusty-gold/35 bg-dusty-gold/12 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18 disabled:cursor-wait disabled:opacity-50"
    >
      {loading ? dictionary.paywall.checkoutLoading : dictionary.account.manageBilling}
    </button>
  );
}
