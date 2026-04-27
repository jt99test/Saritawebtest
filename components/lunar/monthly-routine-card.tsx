import Image from "next/image";
import Link from "next/link";

import type { LunarReportMetadata } from "@/lib/lunar-report";
import { illustrations } from "@/data/illustrations";
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
    <section className="w-full text-center lg:mx-auto lg:grid lg:max-w-[1080px] lg:grid-cols-2 lg:items-center lg:gap-24 lg:text-left">
      <div className="lg:order-2">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        tu práctica este mes
      </p>
      <h3 className="mt-2 font-serif text-[56px] font-normal leading-none text-white">
        {`Elemento ${ELEMENT_LABELS[metadata.element]}`}
      </h3>
      </div>

      <div className="mx-auto mt-20 w-[min(78vw,320px)] lg:order-1 lg:mt-0 lg:max-w-[420px]">
        <Image
          src={illustrations.elements[metadata.assignedRoutine]}
          alt={`Ilustración del elemento ${ELEMENT_LABELS[metadata.element]}`}
          width={320}
          height={320}
          className="h-auto w-full"
          sizes="(max-width: 768px) 78vw, 320px"
        />
      </div>

      <div className="lg:order-3 lg:col-start-2">
      <p className="mx-auto mt-14 max-w-[520px] font-serif text-lg leading-[1.7] text-white/80 lg:mx-0 lg:mt-8 lg:max-w-[420px] lg:text-[20px]">
        {ELEMENT_COPY[metadata.assignedRoutine]}
      </p>

      <p className="mx-auto mt-8 max-w-[720px] font-serif text-[13px] italic leading-7 text-white/50 lg:mx-0 lg:text-sm">
        {[routineNames, mantra, metadata.routine.totalDuration].filter(Boolean).join(" · ")}
      </p>

      <Link
        href={`/yoga-astral/${ROUTE_SEGMENTS[metadata.assignedRoutine]}`}
        className="group mt-12 inline-flex items-center gap-2 font-serif text-[15px] text-dusty-gold/90 transition hover:text-dusty-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusty-gold/60 lg:mt-10 lg:text-[17px]"
      >
        <span>Ver rutina completa</span>
        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </Link>
      </div>
    </section>
  );
}
