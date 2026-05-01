import { Button } from "@react-email/components";
import type { ReactNode } from "react";

type EmailButtonProps = {
  href: string;
  children: ReactNode;
};

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button href={href} style={buttonStyle}>
      {children}
    </Button>
  );
}

const buttonStyle = {
  background: "#b5a36e",
  color: "#0a0a14",
  padding: "14px 32px",
  fontWeight: "600",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "13px",
  borderRadius: "0",
  textDecoration: "none",
};
