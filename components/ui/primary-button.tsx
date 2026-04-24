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
  "group relative inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3.5 text-sm font-semibold transition";

const variants = {
  solid:
    "border border-[#d7ccb0]/30 bg-[linear-gradient(180deg,#f0ebe0,#d8d1c4)] text-cosmic-950 shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.72)] hover:brightness-[1.03]",
  ghostGold:
    "border border-dusty-gold/45 bg-[linear-gradient(180deg,rgba(181,163,110,0.08),rgba(181,163,110,0.02))] text-ivory shadow-[0_18px_60px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-dusty-gold/72 hover:bg-[linear-gradient(180deg,rgba(181,163,110,0.14),rgba(181,163,110,0.04))] hover:text-white",
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
