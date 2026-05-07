import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function PasswordResetPage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-16 sm:py-24">
        <Container>
          <ResetPasswordForm />
        </Container>
      </section>
    </main>
  );
}
