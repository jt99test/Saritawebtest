import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type PasswordResetEmailProps = {
  resetUrl: string;
};

export const subject = "Restablecer contraseña — SARITA";

export default function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout previewText="Restablece tu contraseña SARITA.">
      <Text style={headingStyle}>Restablecer contraseña</Text>
      <Text style={bodyStyle}>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta SARITA.
      </Text>
      <EmailButton href={resetUrl}>Restablecer contraseña</EmailButton>
      <Text style={mutedStyle}>
        Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.
      </Text>
    </EmailLayout>
  );
}

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
