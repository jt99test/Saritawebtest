"use client";

import { PrimaryButton } from "@/components/ui/primary-button";
import type { Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata } from "@/lib/lunar-report";

type LunarRoutineCtaProps = {
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
};

function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

function lunationLabel(metadata: LunarReportMetadata, dictionary: Dictionary) {
  const baseLabel = metadata.lunationType.startsWith("nueva")
    ? dictionary.lunar.newMoon
    : dictionary.lunar.fullMoon;

  return metadata.lunationType.endsWith("-2") ? `${baseLabel} 2` : baseLabel;
}

export function LunarRoutineCta({ metadata, dictionary }: LunarRoutineCtaProps) {
  const copy = dictionary.lunar;
  const href = `/luna-del-mes/rutina/${metadata.lunationType}?year=${metadata.year}&month=${metadata.month}`;
  const ctaLabel = formatTemplate(copy.openLunarRoutineFor, {
    moon: lunationLabel(metadata, dictionary),
  });

  return (
    <section className="sarita-glass-panel mx-auto max-w-[720px] rounded-[1.65rem] px-5 py-6 text-left sm:px-7">
      <p className="sarita-section-label">
        {copy.lunarRoutineEyebrow}
      </p>
      <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h3 className="sarita-sheen inline-block font-serif text-[30px] font-normal leading-tight text-[#fffaf0] sm:text-[36px]">
            {formatTemplate(copy.lunarRoutineTitle, { element: "" }).trim()}
          </h3>
          <p className="mt-3 max-w-[520px] text-sm leading-7 text-[#fffaf0]/72">
            {copy.lunarRoutineBody}
          </p>
        </div>
        <PrimaryButton
          href={href}
          variant="ghostGold"
          className="shrink-0 px-5 py-3 text-[12px] uppercase tracking-[0.18em]"
        >
          {ctaLabel}
        </PrimaryButton>
      </div>
    </section>
  );
}
