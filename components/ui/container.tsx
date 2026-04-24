import { createElement } from "react";
import type { ComponentPropsWithoutRef, ElementType } from "react";

type ContainerProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Container<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: ContainerProps<T>) {
  const Component = (as ?? "div") as ElementType;

  return createElement(Component, {
    className: `mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`.trim(),
    ...props,
  });
}
