import type { ComponentPropsWithoutRef } from "react";

import { Container } from "@/components/ui/container";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string;
  withContainer?: boolean;
  tone?: "default" | "dark";
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
