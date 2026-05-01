import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type WelcomeEmailProps = {
  firstName?: string;
};

export const subject = "Bienvenida a SARITA ✦";

export default function WelcomeEmail({ firstName = "" }: WelcomeEmailProps) {
  const greeting = firstName.trim() ? `Hola ${firstName.trim()}` : "Hola";

  return (
    <EmailLayout previewText="Tu carta astral te espera en SARITA.">
      <Text style={kickerStyle}>{greeting}</Text>
      <Text style={headingStyle}>Bienvenida a SARITA</Text>
      <Text style={bodyStyle}>
        Tu carta astral te espera. SARITA analiza los planetas, aspectos y tránsitos de tu cielo natal
        con una precisión que va más allá de los horóscopos de sol. Cuando estés lista, abre la
        aplicación y traza tu primera carta.
      </Text>
      <EmailButton href={getSiteUrl()}>Abrir SARITA</EmailButton>
      <Text style={mutedStyle}>El cosmos siempre ha sabido que ibas a llegar.</Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const kickerStyle = {
  margin: "0 0 10px",
  color: "#b5a36e",
  fontSize: "13px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

const headingStyle = {
  margin: "0 0 22px",
  color: "#ece8df",
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: "32px",
  lineHeight: "38px",
};

const bodyStyle = {
  margin: "0 0 28px",
  color: "#d8d3c8",
  fontSize: "16px",
  lineHeight: "27px",
};

const mutedStyle = {
  margin: "28px 0 0",
  color: "#8f8a96",
  fontSize: "13px",
  lineHeight: "22px",
};
