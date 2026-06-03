import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import Link from "next/link";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

const SARITA_SHAKTI_URL = "https://saritashakti.com";

type PageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  cta: string;
  back: string;
  notes: string[];
};

const COPY: Record<Locale, PageCopy> = {
  es: {
    eyebrow: "el universo personal de Sarita",
    title: "Sarita Shakti",
    intro:
      "Yoga, energía y acompañamiento para vivir el cuerpo como una práctica consciente.",
    body:
      "SARITA Astrology mira el cielo y sus ciclos. Sarita Shakti recoge la otra parte del trabajo de Sarita: presencia, movimiento, respiración y cuidado energético en una web propia.",
    cta: "Visitar Sarita Shakti",
    back: "Volver a SARITA",
    notes: ["Yoga y práctica corporal", "Energía y escucha interior", "Acompañamiento de Sarita"],
  },
  en: {
    eyebrow: "Sarita's personal universe",
    title: "Sarita Shakti",
    intro:
      "Yoga, energy, and guidance for inhabiting the body as a conscious practice.",
    body:
      "SARITA Astrology reads the sky and its cycles. Sarita Shakti gathers the other side of Sarita's work: presence, movement, breath, and energetic care on its own website.",
    cta: "Visit Sarita Shakti",
    back: "Back to SARITA",
    notes: ["Yoga and body practice", "Energy and inner listening", "Guidance by Sarita"],
  },
  it: {
    eyebrow: "l'universo personale di Sarita",
    title: "Sarita Shakti",
    intro:
      "Yoga, energia e accompagnamento per vivere il corpo come pratica consapevole.",
    body:
      "SARITA Astrology legge il cielo e i suoi cicli. Sarita Shakti raccoglie l'altra parte del lavoro di Sarita: presenza, movimento, respiro e cura energetica in un sito proprio.",
    cta: "Visita Sarita Shakti",
    back: "Torna a SARITA",
    notes: ["Yoga e pratica corporea", "Energia e ascolto interiore", "Accompagnamento di Sarita"],
  },
};

export const metadata: Metadata = {
  title: "Sarita Shakti | SARITA",
  description:
    "The personal yoga, energy, and guidance universe of Sarita, connected with SARITA Astrology.",
};

async function getPageCopy() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  return COPY[locale];
}

export default async function SaritaShaktiPage() {
  const copy = await getPageCopy();

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-7 sm:py-14">
        <Container className="min-h-[100svh] sm:min-h-screen">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(20rem,0.72fr)] lg:items-center">
            <div className="relative z-10">
              <Link
                href="/"
                className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#3a3048] transition hover:text-ivory sm:text-xs sm:tracking-[0.24em]"
              >
                {copy.back}
              </Link>
              <p className="mt-10 font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
                {copy.eyebrow}
              </p>
              <h1 className="mt-3 font-serif text-[48px] leading-[0.96] text-ivory sm:text-[82px]">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-[#fffaf0]/84 sm:text-xl sm:leading-9">
                {copy.intro}
              </p>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#d7e7ff]/72 sm:text-base sm:leading-8">
                {copy.body}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton
                  href={SARITA_SHAKTI_URL}
                  variant="ghostGold"
                  className="min-h-12 px-6 py-3 text-[12px] uppercase tracking-[0.18em]"
                >
                  {copy.cta}
                </PrimaryButton>
              </div>
            </div>

            <aside className="relative overflow-hidden rounded-[1.7rem] border border-[#f5d782]/18 bg-[#071437]/50 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.3),0_0_34px_rgba(0,102,255,0.12)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem]">
                <Image
                  src="/images/sarita-shakti/explicacion.jpeg"
                  alt="Sarita guiando una práctica de yoga"
                  fill
                  sizes="(min-width: 1024px) 34vw, 92vw"
                  className="object-cover object-[52%_42%]"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,20,0),rgba(3,8,20,0.58))]" />
                <div className="absolute inset-x-5 bottom-5 grid gap-2">
                  {copy.notes.map((note) => (
                    <span
                      key={note}
                      className="border-t border-[#f5d782]/22 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fffaf0]/82"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
