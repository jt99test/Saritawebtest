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
    "border border-[#f5d782]/60 bg-[linear-gradient(120deg,rgba(255,231,163,0.92),rgba(245,215,130,0.74)_42%,rgba(215,231,255,0.88))] text-[#030814] shadow-[0_10px_28px_rgba(0,0,0,0.22),0_0_28px_rgba(245,215,130,0.2),inset_0_1px_0_rgba(255,250,240,0.72)] hover:brightness-[1.06]",
  ghostGold:
    "border border-[#f5d782]/48 bg-[linear-gradient(180deg,rgba(7,20,55,0.82),rgba(4,8,24,0.92))] text-[#f5d782] shadow-[0_10px_28px_rgba(0,0,0,0.2),0_0_24px_rgba(0,102,255,0.14),inset_0_1px_0_rgba(255,250,240,0.12)] hover:border-[#ffe7a3] hover:brightness-[1.08]",
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
            ? "bg-[linear-gradient(120deg,transparent,rgba(245,215,130,0.26),transparent)]"
            : "bg-[linear-gradient(120deg,transparent,rgba(255,250,240,0.56),transparent)]",
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
