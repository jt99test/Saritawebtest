import Link from "next/link";

import type { LunarReportMetadata } from "@/lib/lunar-report";
import { yogaRoutines } from "@/data/sarita/yoga-routines";

type MonthlyRoutineCardProps = {
  metadata: LunarReportMetadata;
};

const ELEMENT_LABELS = {
  fire: "Fuego",
  earth: "Tierra",
  air: "Aire",
  water: "Agua",
} as const;

const ROUTE_SEGMENTS = {
  fuego: "fuego",
  tierra: "tierra",
  agua: "agua",
  aire: "aire",
} as const;

const ELEMENT_COPY: Record<LunarReportMetadata["assignedRoutine"], string> = {
  fuego:
    "Esta luna te pide encender. La rutina del Fuego activa lo cardinal y rompe el estancamiento.",
  tierra:
    "Esta luna te pide aterrizar. La rutina de la Tierra ancla el cuerpo y devuelve la presencia.",
  aire:
    "Esta luna te pide claridad. La rutina del Aire abre el pecho y mueve la palabra.",
  agua:
    "Esta luna te pide soltar. La rutina del Agua disuelve la coraza y devuelve la fluidez.",
};

export function MonthlyRoutineCard({ metadata }: MonthlyRoutineCardProps) {
  const routine = yogaRoutines[metadata.assignedRoutine];
  const routineNames = routine.asanas
    .slice(0, 3)
    .map((asana) => asana.nameSanskrit)
    .join(" · ");
  const mantra = `${metadata.routine.chakra.name} · ${metadata.routine.chakra.mantra}`;

  return (
    <section className="mx-auto max-w-[720px] text-left">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        tu práctica este mes
      </p>
      <h3 className="mt-2 font-serif text-[48px] font-normal leading-none text-white lg:text-[72px]">
        {`Elemento ${ELEMENT_LABELS[metadata.element]}`}
      </h3>

      <p className="mt-7 max-w-[560px] font-serif text-[21px] leading-[1.6] text-white/82">
        {ELEMENT_COPY[metadata.assignedRoutine]}
      </p>

      <p className="mt-5 max-w-[620px] font-serif text-sm italic leading-7 text-white/50">
        {[routineNames, mantra, metadata.routine.totalDuration].filter(Boolean).join(" · ")}
      </p>

      <Link
        href={`/yoga-astral/${ROUTE_SEGMENTS[metadata.assignedRoutine]}`}
        className="group mt-8 inline-flex items-center gap-2 font-serif text-[17px] text-dusty-gold/90 transition hover:text-dusty-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60"
      >
        <span>Ver rutina completa</span>
        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </Link>
    </section>
  );
}
