"use client";

import { useState } from "react";

import { PrimaryButton } from "@/components/ui/primary-button";
import { startCheckout } from "@/lib/checkout";

type LavadoBuyButtonProps = {
  label: string;
  loadingLabel: string;
};

export function LavadoBuyButton({ label, loadingLabel }: LavadoBuyButtonProps) {
  const [loading, setLoading] = useState(false);

  return (
    <PrimaryButton
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void startCheckout("lavado").catch(() => setLoading(false));
      }}
    >
      {loading ? loadingLabel : label}
    </PrimaryButton>
  );
}
