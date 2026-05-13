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
      `rounded-[1.2rem] border border-black/12 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.13),inset_0_1px_0_rgba(255,255,255,0.7)] ${className}`.trim(),
    ...props,
  });
}
