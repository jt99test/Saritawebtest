import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

export type RenewalReminderEmailProps = {
  planName: string;
  amount: string;
  renewalDate: string;
};

export const subject = "Tu suscripción SARITA se renueva en 3 días";

export default function RenewalReminderEmail({ planName, amount, renewalDate }: RenewalReminderEmailProps) {
  return (
    <EmailLayout previewText={`Tu plan ${planName} se renovará pronto.`}>
      <Text style={headingStyle}>Renovación próxima</Text>
      <Text style={bodyStyle}>
        Tu plan {planName} se renovará automáticamente el {renewalDate} por {amount}. No necesitas
        hacer nada — solo queríamos avisarte.
      </Text>
      <EmailButton href={`${getSiteUrl()}/cuenta`}>Ver detalles</EmailButton>
      <Text style={mutedStyle}>Si deseas cancelar, hazlo antes de la fecha de renovación.</Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";

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
