import { createElement } from "react";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type PremiumCardProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function PremiumCard<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: PremiumCardProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return createElement(Component, {
    className:
      `rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`.trim(),
    ...props,
  });
}
