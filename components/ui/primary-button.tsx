import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: "solid" | "ghostGold";
};

type LinkButtonProps = SharedProps & {
  href: string;
};

type NativeButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type PrimaryButtonProps = LinkButtonProps | NativeButtonProps;

const baseClassName =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-4 text-sm font-semibold transition";

const variants = {
  solid:
    "border border-black/15 bg-[linear-gradient(180deg,#ffffff,#eee7d9)] text-ivory shadow-[0_10px_28px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.72)] hover:brightness-[1.03]",
  ghostGold:
    "border border-dusty-gold/60 bg-[linear-gradient(180deg,rgba(255,250,240,0.94),rgba(238,231,217,0.9))] text-[#1e1a2e] shadow-[0_10px_28px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] hover:border-dusty-gold hover:brightness-[1.03]",
} as const;

export function PrimaryButton(props: PrimaryButtonProps) {
  const variant = props.variant ?? "solid";
  const buttonClassName = `${baseClassName} ${variants[variant]}`;
  const content = (
    <>
      <span
        className={[
          "absolute inset-0 translate-x-[-120%] opacity-0 transition duration-700 group-hover:translate-x-[120%] group-hover:opacity-100",
          variant === "ghostGold"
            ? "bg-[linear-gradient(120deg,transparent,rgba(214,198,150,0.16),transparent)]"
            : "bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.48),transparent)]",
        ].join(" ")}
      />
      <span className="relative">{props.children}</span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link
        href={props.href}
        className={`${buttonClassName} ${props.className ?? ""}`.trim()}
      >
        {content}
      </Link>
    );
  }

  const className = props.className ?? "";
  const buttonProps = { ...props };
  delete buttonProps.className;
  delete buttonProps.children;
  delete buttonProps.variant;

  return (
    <button className={`${buttonClassName} ${className}`.trim()} {...buttonProps}>
      {content}
    </button>
  );
}
