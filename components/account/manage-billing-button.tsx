"use client";

import { useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { Dictionary } from "@/lib/i18n";

export function ManageBillingButton({ dictionary }: { dictionary: Dictionary }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    const response = await fetch("/api/whop/portal", { method: "POST" }).catch(() => null);
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
    <PrimaryButton
      onClick={() => void openPortal()}
      disabled={loading}
      variant="ghostGold"
      className="mt-6 px-5 py-3 text-[12px] uppercase tracking-[0.2em] disabled:cursor-wait disabled:opacity-50"
    >
      {loading ? dictionary.paywall.checkoutLoading : dictionary.account.manageBilling}
    </PrimaryButton>
  );
}
