import type { ComponentPropsWithoutRef } from "react";

import { Container } from "@/components/ui/container";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string;
  withContainer?: boolean;
  tone?: "default" | "dark" | "tinted";
};

export function Section({
  children,
  className = "",
  containerClassName = "",
  withContainer = true,
  tone = "default",
  ...props
}: SectionProps) {
  const toneClassName =
    tone === "dark"
      ? "premium-noise overflow-hidden bg-[#071437] text-[#d7e7ff] shadow-[0_18px_52px_rgba(0,0,0,0.24),0_0_34px_rgba(0,102,255,0.1)]"
      : tone === "tinted"
        ? "premium-noise overflow-hidden border border-[#f5d782]/20 bg-[#071437]/88 text-[#d7e7ff] shadow-[0_14px_40px_rgba(0,0,0,0.18),0_0_30px_rgba(0,102,255,0.1),inset_0_1px_0_rgba(255,250,240,0.12)]"
      : "";

  return (
    <section className={`relative ${toneClassName} ${className}`.trim()} {...props}>
      {withContainer ? (
        <Container className={containerClassName}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
