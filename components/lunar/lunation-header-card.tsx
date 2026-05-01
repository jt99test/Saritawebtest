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
    .toFormat("d LLL");
  const degreeLabel = `${metadata.position.degree}° ${String(metadata.position.minutes).padStart(
    2,
    "0",
  )}'`;

  return (
    <section className="mx-auto max-w-[720px] border-l border-dusty-gold/18 pl-5 text-left sm:pl-7">
      <p className="text-xs uppercase tracking-[0.22em] text-[#5c4a24]">{signLabel}</p>
      <h2 className="mt-1 font-serif text-[72px] font-normal leading-none text-ivory">
        {degreeLabel}
      </h2>
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-[#3a3048] [font-variant-numeric:tabular-nums]">
        <span>{`Casa ${metadata.activatedHouse}`}</span>
        <span aria-hidden="true">·</span>
        <span>{metadata.areaOfLife}</span>
        <span aria-hidden="true">·</span>
        <span>{dateLabel}</span>
      </p>
      {metadata.eclipse?.isEclipse ? (
        <p className="mt-5 inline-flex border border-amber-300/28 bg-amber-300/[0.08] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-amber-200/82">
          {metadata.eclipse.kind === "solar" ? "Eclipse solar" : "Eclipse lunar"}
        </p>
      ) : null}
    </section>
  );
}
