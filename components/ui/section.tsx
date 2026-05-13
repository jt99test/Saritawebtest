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
      ? "premium-noise overflow-hidden bg-[#13111c] text-[#f5f0e6] shadow-[0_18px_52px_rgba(0,0,0,0.18)]"
      : tone === "tinted"
        ? "premium-noise overflow-hidden border border-dusty-gold/16 bg-[#f8f3ea] text-[#1e1a2e] shadow-[0_14px_40px_rgba(30,26,46,0.08),inset_0_1px_0_rgba(255,255,255,0.75)]"
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
