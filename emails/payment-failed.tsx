import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type PaymentFailedEmailProps = {
  planName: string;
  amount: string;
  retryDate: string;
};

export const subject = "Problema con tu pago — acción requerida";

export default function PaymentFailedEmail({ planName, amount, retryDate }: PaymentFailedEmailProps) {
  return (
    <EmailLayout previewText="No pudimos procesar tu pago de SARITA.">
      <Text style={headingStyle}>No pudimos procesar tu pago</Text>
      <Text style={bodyStyle}>
        Intentamos cobrar {amount} para tu suscripción {planName}, pero el pago no se completó.
        Volveremos a intentarlo el {retryDate}.
      </Text>
      <EmailButton href={`${getSiteUrl()}/cuenta`}>Actualizar método de pago</EmailButton>
      <Text style={mutedStyle}>
        Si no actualizas tu método de pago, tu suscripción se cancelará automáticamente.
      </Text>
    </EmailLayout>
  );
}

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const headingStyle = {
  margin: "0 0 22px",
  color: "#c45a5a",
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
