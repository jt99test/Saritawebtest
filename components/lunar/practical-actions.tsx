import type { LunarReportActionSet } from "@/lib/lunar-report";
import type { Dictionary } from "@/lib/i18n";
import { Section } from "@/components/ui/section";

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
    <Section
      tone="tinted"
      withContainer={false}
      className="sarita-glass-panel mx-auto max-w-[720px] rounded-[1.8rem] px-5 py-7 pb-10 lg:pb-12 sm:px-7"
    >
      <div className="text-center">
        <p className="sarita-section-label">
          {copy.eyebrow}
        </p>
        <h3 className="sarita-sheen mt-1.5 inline-block font-serif text-[32px] font-normal leading-tight text-[#fffaf0]">
          {copy.title}
        </h3>
      </div>

      {actions ? (
        <div className="mt-9">
          {ACTION_CARDS.map((card, index) => (
            <div
              key={card.id}
              className="relative border-t-[0.5px] border-[#d7bd6a]/16 py-6 text-left first:border-t-0 first:pt-0 last:border-b-[0.5px]"
            >
              <p className="text-[12px] uppercase tracking-[0.16em] text-[#d7bd6a]">
                {copy[card.labelKey]}
              </p>
              <p className="mt-3 pr-10 font-serif text-[21px] font-normal leading-[1.5] text-[#fffaf0]/90">
                {actions[card.id]}
              </p>
              <p
                className={[
                  "absolute right-0 text-[12px] text-[#d7d0ff]/28 [font-variant-numeric:tabular-nums]",
                  index === 0 ? "top-0" : "top-6",
                ].join(" ")}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mx-auto mt-8 max-w-[440px] text-center font-serif text-[17px] italic leading-[1.7] text-[#d7d0ff]/72">
          {copy.empty}
        </p>
      )}
    </Section>
  );
}
