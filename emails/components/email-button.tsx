import type { ReactNode } from "react";

type EmailButtonProps = {
  href: string;
  children: ReactNode;
};

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <a href={href} style={buttonStyle} target="_blank">
      {children}
    </a>
  );
}

const buttonStyle = {
  background: "#b5a36e",
  color: "#0a0a14",
  display: "inline-block",
  padding: "14px 32px",
  fontWeight: "600",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "13px",
  lineHeight: "18px",
  borderRadius: "0",
  textDecoration: "none",
};
