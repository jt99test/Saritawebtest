import type { ComponentPropsWithoutRef } from "react";

export function SectionTitle({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"h2">) {
  return (
    <h2
      className={`text-4xl leading-tight text-ivory sm:text-5xl ${className}`.trim()}
      {...props}
    />
  );
}
