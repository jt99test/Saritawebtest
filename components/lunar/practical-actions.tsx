import type { LunarReportActionSet } from "@/lib/lunar-report";

type PracticalActionsProps = {
  actions: LunarReportActionSet | null;
  loading: boolean;
};

const ACTION_CARDS = [
  {
    id: "hazEsto",
    title: "haz esto",
  },
  {
    id: "evitaEsto",
    title: "evita esto",
  },
  {
    id: "preguntate",
    title: "pregúntate",
  },
] as const;

export function PracticalActions({ actions }: PracticalActionsProps) {
  return (
    <section className="mx-auto max-w-[720px] pb-24 lg:pb-[120px]">
      <div className="text-center">
        <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
          bájalo a tierra
        </p>
        <h3 className="mt-2 font-serif text-[32px] font-normal leading-tight text-white lg:text-[40px]">
          Tres cosas para esta luna
        </h3>
      </div>

      {actions ? (
        <div className="mt-16 space-y-16 lg:space-y-20">
          {ACTION_CARDS.map((card, index) => (
            <div key={card.id} className="text-left">
              <p className="font-serif text-[40px] font-normal leading-none text-dusty-gold/60 lg:text-[56px]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 font-serif text-[13px] italic lowercase tracking-[0.1em] text-white/50">
                {card.title}
              </p>
              <p className="mt-4 font-serif text-[22px] font-normal leading-[1.5] text-white lg:text-[26px]">
                {actions[card.id]}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mx-auto mt-16 max-w-[440px] text-center font-serif text-[17px] italic leading-[1.7] text-white/50">
          Genera tu lectura arriba y aquí aparecerán las tres prácticas concretas para esta luna.
        </p>
      )}
    </section>
  );
}
