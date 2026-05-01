import { Text } from "@react-email/components";

import { EmailLayout } from "./components/email-layout";

export const subject = "Tu cuenta SARITA ha sido eliminada";

export default function AccountDeletionEmail() {
  return (
    <EmailLayout previewText="Tu cuenta SARITA ha sido eliminada.">
      <Text style={headingStyle}>Cuenta eliminada</Text>
      <Text style={bodyStyle}>
        Tu cuenta y todos tus datos astrológicos han sido eliminados permanentemente de SARITA. Si
        esto fue un error, contacta con nosotros respondiendo a este correo.
      </Text>
      <Text style={mutedStyle}>Fue un honor acompañarte en tu viaje astral.</Text>
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
  margin: "0",
  color: "#8f8a96",
  fontSize: "13px",
  lineHeight: "22px",
};
