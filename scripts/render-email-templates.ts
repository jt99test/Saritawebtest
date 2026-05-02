import { mkdir, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { render } from "@react-email/render";

import * as ConfirmationModule from "../emails/confirmation";
import * as PasswordResetModule from "../emails/password-reset";

async function main() {
  const outputDir = "docs/supabase-email-templates";
  await mkdir(outputDir, { recursive: true });
  process.env.NEXT_PUBLIC_SITE_URL ??= "{{ .SiteURL }}";
  const ConfirmationEmail = getDefaultExport(ConfirmationModule);
  const PasswordResetEmail = getDefaultExport(PasswordResetModule);

  const confirmationHtml = await render(
    createElement(ConfirmationEmail, { confirmationUrl: "{{ .ConfirmationURL }}" }),
  );
  const passwordResetHtml = await render(
    createElement(PasswordResetEmail, { resetUrl: "{{ .ConfirmationURL }}" }),
  );

  await writeFile(`${outputDir}/confirmation.html`, confirmationHtml, "utf8");
  await writeFile(`${outputDir}/password-reset.html`, passwordResetHtml, "utf8");
}

function getDefaultExport<T>(moduleValue: { default: T } | { default: { default: T } }) {
  const firstDefault = moduleValue.default;
  return typeof firstDefault === "object" && firstDefault !== null && "default" in firstDefault
    ? firstDefault.default
    : firstDefault;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
