import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type LavadoReceiptEmailProps = {
  amount: string;
};

export const subject = "Acceso a Lavado Intestinal Kunjal Kriya — Confirmación";

export default function LavadoReceiptEmail({ amount }: LavadoReceiptEmailProps) {
  return (
    <EmailLayout previewText="Tu acceso a Lavado Intestinal está desbloqueado.">
      <Text style={headingStyle}>Acceso desbloqueado</Text>
      <Text style={bodyStyle}>
        Has adquirido el acceso permanente al programa de Lavado Intestinal Kunjal Kriya. Puedes
        acceder al contenido en cualquier momento desde la sección de Yoga Astral.
      </Text>
      <EmailButton href={`${getSiteUrl()}/yoga-astral/kriyas/lavado-intestinal`}>Ver programa</EmailButton>
      <Text style={mutedStyle}>Pago único de {amount} — acceso de por vida</Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
