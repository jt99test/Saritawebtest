import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { illustrations } from "@/data/illustrations";
import { yogaRoutines } from "@/data/sarita/yoga-routines";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { PremiumCard } from "@/components/ui/premium-card";
import { AsanaVisual } from "@/components/yoga/asana-visual";
import { RoutineCompletionButton } from "@/components/yoga/routine-completion-button";

type Elemento = keyof typeof yogaRoutines;

const ELEMENTOS = ["fuego", "tierra", "agua", "aire"] as const;

const ELEMENT_ALT_TEXT: Record<Elemento, string> = {
  fuego: "Ilustracion del elemento Fuego",
  tierra: "Ilustracion del elemento Tierra",
  agua: "Ilustracion del elemento Agua",
  aire: "Ilustracion del elemento Aire",
};

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈",
  Tauro: "♉",
  Géminis: "♊",
  Cancer: "♋",
  Cáncer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Escorpio: "♏",
  Sagitario: "♐",
  Capricornio: "♑",
  Acuario: "♒",
  Piscis: "♓",
};

function isElemento(value: string): value is Elemento {
  return ELEMENTOS.includes(value as Elemento);
}

export function generateStaticParams() {
  return ELEMENTOS.map((elemento) => ({ elemento }));
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-[2rem] leading-tight text-ivory sm:text-[2.35rem]">
        {children}
      </h2>
      <div className="mt-3 h-0.5 w-10 rounded-full bg-[#e8c547]" />
    </div>
  );
}

export default async function YogaAstralElementPage({
  params,
}: {
  params: Promise<{ elemento: string }>;
}) {
  const { elemento } = await params;

  if (!isElemento(elemento)) {
    notFound();
  }

  const routine = yogaRoutines[elemento];
  const chakraName = routine.chakra.name.split(" ")[0];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />

      <section className="relative py-6 sm:py-8">
        <Container className="relative">
          <div className="mb-6 flex items-center justify-between gap-4 pt-2">
            <Link
              href="/yoga-astral"
              className="text-xs font-medium uppercase tracking-[0.28em] text-ivory/54 transition hover:text-ivory"
            >
              Volver a Yoga astral
            </Link>
          </div>

          <div className="space-y-10 pb-10">
            <PremiumCard className="overflow-hidden border-[#e8c547]/18 bg-[linear-gradient(180deg,rgba(23,12,36,0.82),rgba(8,10,18,0.74))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7">
              <div className="rounded-[1.45rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(232,197,71,0.13),transparent_34%),linear-gradient(180deg,rgba(15,10,28,0.9),rgba(8,10,18,0.82))] px-5 py-8 sm:px-8 sm:py-10">
                <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
                  <Image
                    src={illustrations.elements[elemento]}
                    alt={ELEMENT_ALT_TEXT[elemento]}
                    width={120}
                    height={120}
                    priority
                    className="h-[120px] w-[120px] object-contain drop-shadow-[0_0_30px_rgba(232,197,71,0.24)]"
                    sizes="120px"
                  />
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e8c547]/80">
                      Yoga astral
                    </p>
                    <h1 className="mt-4 font-serif text-5xl leading-tight text-ivory sm:text-6xl">
                      {routine.title}
                    </h1>
                    <p className="mt-4 text-base leading-8 text-ivory/72">
                      {routine.bodyZone}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Planetas", routine.planets.join(" · ")],
                    [
                      "Signos",
                      routine.signs
                        .map((sign) => `${SIGN_GLYPHS[sign] ?? "✦"} ${sign}`)
                        .join(" · "),
                    ],
                    ["Casas", routine.houses.join(" · ")],
                    ["Chakra", `${chakraName} · Mantra ${routine.chakra.mantra}`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[1rem] border border-[#e8c547]/16 bg-white/[0.035] p-4"
                    >
                      <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#e8c547]/74">
                        {label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-ivory/78">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-7 max-w-3xl text-sm leading-7 text-ivory/68">
                  {routine.intention}
                </p>
              </div>
            </PremiumCard>

            <section className="space-y-5">
              <SectionHeader>Tu carta y este elemento</SectionHeader>
              <div className="grid gap-4 lg:grid-cols-3">
                {routine.signsAndHouses.map((entry) => (
                  <PremiumCard
                    key={entry.sign}
                    className="border-[#e8c547]/14 bg-[linear-gradient(180deg,rgba(20,10,35,0.72),rgba(9,12,22,0.66))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[#e8c547]/76">
                      Casa {entry.houseNumber}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl text-ivory">
                      {SIGN_GLYPHS[entry.sign] ?? "✦"} {entry.sign}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-ivory/66">
                      {entry.description}
                    </p>
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>La secuencia · {routine.totalDuration}</SectionHeader>
              <ol className="space-y-6">
                {routine.asanas.map((asana, index) => {
                  const reverse = index % 2 === 1;

                  return (
                    <li key={`${asana.slug}-${index}`}>
                      <PremiumCard className="overflow-hidden border-[#e8c547]/16 bg-[linear-gradient(180deg,rgba(20,10,35,0.76),rgba(9,12,22,0.7))] shadow-[0_26px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                        <div className="grid gap-0 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1fr)]">
                          <div
                            className={`border-b border-white/8 p-4 sm:p-5 lg:border-b-0 ${
                              reverse ? "lg:order-2 lg:border-l" : "lg:border-r"
                            }`}
                          >
                            <AsanaVisual asana={asana} tone={elemento} />
                          </div>
                          <div className="flex flex-col justify-center p-6 sm:p-8">
                            <div className="flex items-center gap-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8c547]/28 bg-[#e8c547]/10 font-serif text-xl text-[#e8c547]">
                                {index + 1}
                              </span>
                              <span className="rounded-full border border-[#e8c547]/18 bg-[#e8c547]/10 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#e8c547]/88">
                                {asana.duration}
                              </span>
                            </div>
                            <h3 className="mt-5 font-serif text-3xl leading-tight text-ivory">
                              {asana.nameSanskrit}
                            </h3>
                            <p className="mt-1 text-sm uppercase tracking-[0.2em] text-ivory/46">
                              {asana.nameSpanish}
                            </p>
                            <p className="mt-5 text-sm leading-7 text-ivory/68">
                              {asana.description}
                            </p>
                          </div>
                        </div>
                      </PremiumCard>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="space-y-5">
              <SectionHeader>Pranayama · después de la secuencia</SectionHeader>
              <div className="grid gap-5 md:grid-cols-2">
                {routine.pranayama.map((item) => (
                  <PremiumCard
                    key={item.name}
                    className="border-[#e8c547]/14 bg-[linear-gradient(180deg,rgba(20,10,35,0.74),rgba(9,12,22,0.66))] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-7"
                  >
                    <h3 className="font-serif text-3xl text-ivory">{item.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-ivory/68">
                      {item.description}
                    </p>
                    {item.contraindications ? (
                      <div className="mt-5 rounded-[1rem] border border-amber-300/28 bg-amber-300/8 p-4 text-sm leading-7 text-amber-100/82">
                        {item.contraindications}
                      </div>
                    ) : null}
                  </PremiumCard>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <SectionHeader>Savasana · {routine.savasana.duration}</SectionHeader>
              <PremiumCard className="mx-auto max-w-4xl border-[#e8c547]/16 bg-[radial-gradient(circle_at_top,rgba(232,197,71,0.1),transparent_38%),linear-gradient(180deg,rgba(20,10,35,0.72),rgba(9,12,22,0.66))] px-6 py-9 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-10">
                <p className="text-base leading-8 text-ivory/72">
                  {routine.savasana.visualization}
                </p>
                <p className="mt-8 font-serif text-3xl text-[#e8c547]">
                  Mantra bija: {routine.chakra.mantra} · {chakraName}
                </p>
              </PremiumCard>
            </section>

            <footer className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/yoga-astral"
                className="text-xs font-medium uppercase tracking-[0.24em] text-ivory/54 transition hover:text-ivory"
              >
                Volver a Yoga astral
              </Link>
              <RoutineCompletionButton storageKey={`sarita:yoga:${elemento}:completed`} />
            </footer>
          </div>
        </Container>
      </section>
    </main>
  );
}
