import type { ComponentPropsWithoutRef } from "react";

import { Container } from "@/components/ui/container";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  containerClassName?: string;
  withContainer?: boolean;
};

export function Section({
  children,
  className = "",
  containerClassName = "",
  withContainer = true,
  ...props
}: SectionProps) {
  return (
    <section className={`relative ${className}`.trim()} {...props}>
      {withContainer ? (
        <Container className={containerClassName}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}
