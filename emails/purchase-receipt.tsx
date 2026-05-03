import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

export type PurchaseReceiptEmailProps = {
  planName: string;
  billingPeriod: "monthly" | "yearly";
  amount: string;
  nextBillingDate: string;
};

export function subject({ planName }: Pick<PurchaseReceiptEmailProps, "planName">) {
  return `Confirmación de suscripción — ${planName}`;
}

export default function PurchaseReceiptEmail({
  planName,
  billingPeriod,
  amount,
  nextBillingDate,
}: PurchaseReceiptEmailProps) {
  return (
    <EmailLayout previewText={`Tu suscripción ${planName} está activa.`}>
      <Text style={headingStyle}>Suscripción activada</Text>
      <Section style={summaryStyle}>
        <Text style={summaryLineStyle}>Plan: {planName}</Text>
        <Text style={summaryLineStyle}>Periodo: {billingPeriod === "yearly" ? "Anual" : "Mensual"}</Text>
        <Text style={summaryLineStyle}>Importe: {amount}</Text>
        <Text style={summaryLineStyle}>Próxima renovación: {nextBillingDate}</Text>
      </Section>
      <Text style={bodyStyle}>
        Tu plan {planName} está activo. Accede a todas las funciones desde tu carta astral.
      </Text>
      <EmailButton href={getSiteUrl()}>Ir a SARITA</EmailButton>
      <Text style={mutedStyle}>Puedes gestionar o cancelar tu suscripción desde tu cuenta.</Text>
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

const summaryStyle = {
  margin: "0 0 26px",
  padding: "20px",
  background: "#0a0a14",
  border: "1px solid #2a2a3a",
};

const summaryLineStyle = {
  margin: "0 0 10px",
  color: "#d8d3c8",
  fontSize: "14px",
  lineHeight: "22px",
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
