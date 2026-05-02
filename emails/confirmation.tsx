import { Text } from "@react-email/components";

import { EmailButton } from "./components/email-button";
import { EmailLayout } from "./components/email-layout";

type ConfirmationEmailProps = {
  confirmationUrl: string;
};

export const subject = "Confirma tu cuenta SARITA";

export default function ConfirmationEmail({ confirmationUrl }: ConfirmationEmailProps) {
  return (
    <EmailLayout previewText="Confirma tu cuenta SARITA.">
      <Text style={headingStyle}>Confirma tu dirección de correo</Text>
      <Text style={bodyStyle}>
        Para activar tu cuenta SARITA, confirma tu dirección de correo electrónico.
      </Text>
      <EmailButton href={confirmationUrl}>Confirmar cuenta</EmailButton>
      <Text style={linkHelpStyle}>
        Si el botón no abre, copia y pega este enlace en tu navegador:
        <br />
        <a href={confirmationUrl} style={rawLinkStyle}>
          {confirmationUrl}
        </a>
      </Text>
      <Text style={mutedStyle}>Si no creaste esta cuenta, ignora este mensaje.</Text>
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

const linkHelpStyle = {
  margin: "22px 0 0",
  color: "#8f8a96",
  fontSize: "12px",
  lineHeight: "20px",
  wordBreak: "break-word" as const,
};

const rawLinkStyle = {
  color: "#b5a36e",
  textDecoration: "underline",
};
