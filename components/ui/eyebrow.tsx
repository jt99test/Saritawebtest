import type { ComponentPropsWithoutRef } from "react";

export function Eyebrow({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={`text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-ivory/70 ${className}`.trim()}
      {...props}
    />
  );
}
