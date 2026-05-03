import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

export type PlanUpgradeEmailProps = {
  oldPlan: string;
  newPlan: string;
  amount: string;
};

export function subject({ newPlan }: Pick<PlanUpgradeEmailProps, "newPlan">) {
  return `Tu plan ha sido actualizado a ${newPlan}`;
}

export default function PlanUpgradeEmail({ oldPlan, newPlan, amount }: PlanUpgradeEmailProps) {
  return (
    <EmailLayout previewText={`Tu plan ha sido actualizado a ${newPlan}.`}>
      <Text style={headingStyle}>Plan actualizado</Text>
      <Text style={bodyStyle}>
        Has pasado del plan {oldPlan} al plan {newPlan}. Las nuevas funciones ya están disponibles
        en tu carta astral.
      </Text>
      <Text style={mutedStyle}>Nuevo importe: {amount}</Text>
      <EmailButton href={`${getSiteUrl()}/resultado`}>Explorar funciones</EmailButton>
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
