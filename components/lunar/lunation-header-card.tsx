import { DateTime } from "luxon";

import type { Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata } from "@/lib/lunar-report";

type LunationHeaderCardProps = {
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
  timezone: string;
  locale: string;
};

export function LunationHeaderCard({
  metadata,
  dictionary,
  timezone,
  locale,
}: LunationHeaderCardProps) {
  const signLabel =
    dictionary.result.signs[metadata.position.sign as keyof typeof dictionary.result.signs] ??
    metadata.position.sign;
  const dateLabel = DateTime.fromISO(metadata.timestamp, { zone: "utc" })
    .setZone(timezone)
    .setLocale(locale)
    .toFormat("d LLL");
  const degreeLabel = `${metadata.position.degree}° ${String(metadata.position.minutes).padStart(
    2,
    "0",
  )}'`;

  return (
    <section className="sarita-glass-panel mx-auto max-w-[720px] rounded-[1.65rem] px-5 py-6 text-left sm:px-7">
      <p className="sarita-section-label">{signLabel}</p>
      <h2 className="sarita-sheen mt-1 inline-block font-serif text-[48px] font-normal leading-none text-[#fffaf0] sm:text-[72px]">
        {degreeLabel}
      </h2>
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-[#d7d0ff]/70 [font-variant-numeric:tabular-nums]">
        <span>{`${dictionary.result.fields.house} ${metadata.activatedHouse}`}</span>
        <span aria-hidden="true">·</span>
        <span>{metadata.areaOfLife}</span>
        <span aria-hidden="true">·</span>
        <span>{dateLabel}</span>
      </p>
      {metadata.eclipse?.isEclipse ? (
        <p className="mt-5 inline-flex border border-[#f5d782]/32 bg-[#f5d782]/[0.08] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f5d782]/86">
          {metadata.eclipse.kind === "solar" ? dictionary.lunar.solarEclipse : dictionary.lunar.lunarEclipse}
        </p>
      ) : null}
    </section>
  );
}
