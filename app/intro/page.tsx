import type { Metadata } from "next";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PrimaryButton } from "@/components/ui/primary-button";

export const metadata: Metadata = {
  title: "Intro | SARITA",
  description: "Aprende como funciona SARITA antes de crear tu carta natal.",
};

const loomEmbedUrl = "https://www.loom.com/embed/6b4a02e4b2a0405f9d764cd77d36d594";

export default function IntroPage() {
  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950 text-[#fffaf0]">
      <AtmosphericBackground variant="page" />
      <section className="relative flex min-h-screen items-center py-10 sm:py-14">
        <Container className="relative w-full">
          <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
            <p className="font-serif text-[15px] italic lowercase tracking-[0.18em] text-[#f5d782]">
              conoce sarita
            </p>
            <h1 className="mt-3 font-serif text-[clamp(4.4rem,12vw,8.75rem)] font-normal leading-none text-[#fffaf0]">
              SARITA
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d7e7ff]/74 sm:text-base sm:leading-8">
              Aprende cómo leer tu carta, tus tránsitos y tus ciclos en un solo lugar.
            </p>

            <div className="mt-9 w-full max-w-5xl overflow-hidden rounded-[0.5rem] border border-[#d7e7ff]/14 bg-[#061331]/64 shadow-[0_28px_90px_rgba(0,0,0,0.36),0_0_54px_rgba(0,102,255,0.14)] backdrop-blur-md">
              <div className="relative aspect-video w-full">
                <iframe
                  src={loomEmbedUrl}
                  title="Introducción a SARITA"
                  allow="fullscreen; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>

            <PrimaryButton
              href="/"
              className="mt-8 px-8 py-4 text-[12px] uppercase tracking-[0.24em]"
            >
              Entrar a SARITA
            </PrimaryButton>
          </div>
        </Container>
      </section>
    </main>
  );
}
