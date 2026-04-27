import { DateTime } from "luxon";

import type { Dictionary } from "@/lib/i18n";
import type { LunarReportMetadata } from "@/lib/lunar-report";

type LunationHeaderCardProps = {
  metadata: LunarReportMetadata;
  dictionary: Dictionary;
  timezone: string;
};

export function LunationHeaderCard({
  metadata,
  dictionary,
  timezone,
}: LunationHeaderCardProps) {
  const signLabel =
    dictionary.result.signs[metadata.position.sign as keyof typeof dictionary.result.signs] ??
    metadata.position.sign;
  const dateLabel = DateTime.fromISO(metadata.timestamp, { zone: "utc" })
    .setZone(timezone)
    .setLocale("es")
    .toFormat("d 'de' LLLL");
  const degreeLabel = `${signLabel} ${metadata.position.degree}° ${String(
    metadata.position.minutes,
  ).padStart(2, "0")}'`;

  return (
    <section className="mx-auto max-w-[720px] text-center">
      <p className="font-serif text-[13px] italic lowercase tracking-[0.15em] text-dusty-gold/50">
        el momento exacto
      </p>
      <h2 className="mt-2 font-serif text-[40px] font-normal leading-tight text-white lg:text-[56px]">
        {degreeLabel}
      </h2>
      <p className="mx-auto mt-3 max-w-[560px] font-serif text-sm italic leading-7 text-white/55 lg:text-base">
        {`activa tu Casa ${metadata.activatedHouse} · ${metadata.areaOfLife.toLowerCase()} · ${dateLabel}`}
      </p>
    </section>
  );
}
