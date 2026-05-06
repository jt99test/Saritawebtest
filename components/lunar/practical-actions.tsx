import type { LunarReportActionSet } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";

type PracticalActionsProps = {
  actions: LunarReportActionSet | null;
  dictionary: Dictionary;
  loading: boolean;
};

const ACTION_CARDS = [
  {
    id: "hazEsto",
    labelKey: "do",
  },
  {
    id: "evitaEsto",
    labelKey: "avoid",
  },
  {
    id: "preguntate",
    labelKey: "ask",
  },
] as const;

export function PracticalActions({ actions, dictionary }: PracticalActionsProps) {
  const copy = dictionary.lunarActions;

  return (
    <section className="mx-auto max-w-[720px] pb-16 lg:pb-20">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {copy.eyebrow}
        </p>
        <h3 className="mt-1.5 font-serif text-[32px] font-normal leading-tight text-ivory">
          {copy.title}
        </h3>
      </div>

      {actions ? (
        <div className="mt-9">
          {ACTION_CARDS.map((card, index) => (
            <div
              key={card.id}
              className="relative border-t-[0.5px] border-dusty-gold/12 py-6 text-left first:border-t-0 first:pt-0 last:border-b-[0.5px]"
            >
              <p className="text-[12px] uppercase tracking-[0.16em] text-[#5c4a24]">
                {copy[card.labelKey]}
              </p>
              <p className="mt-3 pr-10 font-serif text-[21px] font-normal leading-[1.5] text-ivory">
                {actions[card.id]}
              </p>
              <p
                className={[
                  "absolute right-0 text-[12px] text-ivory/20 [font-variant-numeric:tabular-nums]",
                  index === 0 ? "top-0" : "top-6",
                ].join(" ")}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mx-auto mt-8 max-w-[440px] text-center font-serif text-[17px] italic leading-[1.7] text-[#3a3048]">
          {copy.empty}
        </p>
      )}
    </section>
  );
}
