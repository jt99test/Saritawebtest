import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type CancellationEmailProps = {
  planName: string;
  accessUntil: string;
};

export const subject = "Tu suscripción ha sido cancelada";

export default function CancellationEmail({ planName, accessUntil }: CancellationEmailProps) {
  return (
    <EmailLayout previewText={`Tu suscripción ${planName} ha sido cancelada.`}>
      <Text style={headingStyle}>Suscripción cancelada</Text>
      <Text style={bodyStyle}>
        Tu suscripción al plan {planName} ha sido cancelada. Seguirás teniendo acceso hasta el{" "}
        {accessUntil}, después de lo cual tu cuenta pasará al plan gratuito.
      </Text>
      <Text style={mutedStyle}>
        Si cambiaste de opinión, puedes reactivar tu suscripción en cualquier momento.
      </Text>
      <EmailButton href={`${getSiteUrl()}/cuenta`}>Gestionar cuenta</EmailButton>
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
  margin: "0 0 24px",
  color: "#d8d3c8",
  fontSize: "16px",
  lineHeight: "27px",
};

const mutedStyle = {
  margin: "0 0 28px",
  color: "#8f8a96",
  fontSize: "13px",
  lineHeight: "22px",
};
