import type { ComponentPropsWithoutRef } from "react";

export function Eyebrow({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={`text-[12px] font-semibold uppercase tracking-[0.38em] text-ivory/82 ${className}`.trim()}
      {...props}
    />
  );
}
