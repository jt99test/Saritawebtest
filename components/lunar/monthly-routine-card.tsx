import { PrimaryButton } from "@/components/ui/primary-button";
import type { LunarReportMetadata } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";
import { yogaRoutines } from "@/data/sarita/yoga-routines";

type MonthlyRoutineCardProps = {
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
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

export function MonthlyRoutineCard({ metadata, dictionary }: MonthlyRoutineCardProps) {
  const routine = yogaRoutines[metadata.assignedRoutine];
  const routineNames = routine.asanas
    .slice(0, 3)
    .map((asana) => asana.nameSanskrit)
    .join(" · ");
  const mantra = `${metadata.routine.chakra.name} · ${metadata.routine.chakra.mantra}`;

  return (
    <section className="mx-auto max-w-[720px] text-left">
      <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
        {dictionary.lunar.practiceThisMonth}
      </p>
      <h3 className="mt-2 font-serif text-[36px] font-normal leading-tight text-ivory">
        {dictionary.lunar.elementLabel.replace("{element}", ELEMENT_LABELS[metadata.element])}
      </h3>

      <p className="mt-7 max-w-[560px] font-serif text-[21px] leading-[1.6] text-ivory/82">
        {ELEMENT_COPY[metadata.assignedRoutine]}
      </p>

      <p className="mt-5 max-w-[620px] font-serif text-sm italic leading-7 text-[#3a3048]">
        {[routineNames, mantra, metadata.routine.totalDuration].filter(Boolean).join(" · ")}
      </p>

      <PrimaryButton
        href={`/yoga-astral/${ROUTE_SEGMENTS[metadata.assignedRoutine]}`}
        variant="ghostGold"
        className="mt-8 px-6 py-3 text-[12px] uppercase tracking-[0.2em]"
      >
        {dictionary.lunar.seeRoutine}
      </PrimaryButton>
    </section>
  );
}
