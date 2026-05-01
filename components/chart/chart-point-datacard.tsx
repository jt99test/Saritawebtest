"use client";

import type { Dictionary } from "@/lib/i18n";
import {
  formatSignPosition,
  getSignMeta,
  zodiacSigns,
  type ChartPoint,
  type ChartPointId,
  type NatalChartData,
} from "@/lib/chart";

type ChartPointDataCardProps = {
  chart: NatalChartData;
  point: ChartPoint;
  dictionary: Dictionary;
  onSelectPoint?: (pointId: ChartPointId) => void;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#5c4a24]">
      {children}
    </p>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-3">
      <dt className="text-sm text-[#3a3048]">{label}</dt>
      <dd className="text-right text-sm text-ivory/88">{value}</dd>
    </div>
  );
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white px-4 py-4">
      <p className="text-lg text-ivory">{title}</p>
      <ul className="mt-4 space-y-2 text-sm leading-6 text-[#3a3048]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-dusty-gold/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function houseLabel(dictionary: Dictionary, house: number) {
  const houseKey = String(house) as keyof typeof dictionary.result.houseMeanings;
  return `${dictionary.result.fields.house} ${house} · ${dictionary.result.houseMeanings[houseKey]}`;
}

export function ChartPointDataCard({
  chart,
  point,
  dictionary,
  onSelectPoint,
}: ChartPointDataCardProps) {
  const signMeta = getSignMeta(point.sign);
  const signGlyph = zodiacSigns.find((sign) => sign.id === point.sign)?.glyph ?? "";
  const pointAspects = chart.aspects
    .filter((aspect) => aspect.from === point.id || aspect.to === point.id)
    .sort((left, right) => left.orb - right.orb);
  const position = formatSignPosition(point.longitude);
  const houseKey = String(point.house) as keyof typeof dictionary.result.houseMeanings;

  const signLens = [
    `${dictionary.result.signs[point.sign]} · ${dictionary.result.elements[signMeta.element]}`,
    `${dictionary.result.fields.modality}: ${dictionary.result.modalities[signMeta.modality]}`,
    dictionary.result.editorial.signPrompts[point.sign],
  ];

  const houseLens = [
    houseLabel(dictionary, point.house),
    dictionary.result.editorial.housePrompts[houseKey],
    point.retrograde
      ? dictionary.result.editorial.retrogradeActive
      : dictionary.result.editorial.retrogradeDirect,
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[1.9rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
        <div className="border-b border-black/10 px-5 py-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#5c4a24]">
            {dictionary.result.panels.selectedPoint}
          </p>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-[2.4rem] leading-none" style={{ color: point.color }}>
                  {point.glyph}
                </span>
                <div>
                  <p className="font-serif text-[1.9rem] leading-none text-ivory">
                    {dictionary.result.points[point.id]}
                  </p>
                  <p className="mt-2 text-sm text-[#3a3048]">
                    {dictionary.result.signs[point.sign]} · {houseLabel(dictionary, point.house)}
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-7 text-ivory/82">
                {dictionary.result.editorial.summaryPrefix}{" "}
                <span className="text-ivory">
                  {dictionary.result.points[point.id]}
                </span>{" "}
                {dictionary.result.editorial.summaryMiddle}{" "}
                <span className="text-ivory">
                  {dictionary.result.signs[point.sign]}
                </span>{" "}
                {dictionary.result.editorial.summarySuffix}{" "}
                <span className="text-ivory">
                  {dictionary.result.houseMeanings[houseKey]}
                </span>.
              </p>
            </div>

            <div
              className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.05] text-[2rem] md:flex"
              style={{ color: point.color }}
            >
              {point.glyph}
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="border-b border-black/10 px-5 py-5 md:border-b-0 md:border-r">
            <SectionLabel>{dictionary.result.editorial.signFocus}</SectionLabel>
            <DetailList title={dictionary.result.signs[point.sign]} items={signLens} />
          </div>
          <div className="px-5 py-5">
            <SectionLabel>{dictionary.result.editorial.houseFocus}</SectionLabel>
            <DetailList title={houseLabel(dictionary, point.house)} items={houseLens} />
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>{dictionary.result.editorial.technicalSheet}</SectionLabel>
        <div className="overflow-hidden rounded-[1.7rem] border border-black/10 bg-white">
          <dl className="divide-y divide-white/8 px-4">
            <InfoRow label={dictionary.result.fields.position} value={point.degreeLabel} />
            <InfoRow
              label={dictionary.result.fields.zodiacPosition}
              value={`${position.degreeInSign}° ${String(position.minutesInSign).padStart(2, "0")}′ ${signGlyph}`}
            />
            <InfoRow label={dictionary.result.fields.eclipticLongitude} value={point.absoluteLongitudeLabel} />
            <InfoRow label={dictionary.result.fields.sign} value={dictionary.result.signs[point.sign]} />
            <InfoRow label={dictionary.result.fields.house} value={String(point.house)} />
            <InfoRow label={dictionary.result.fields.element} value={dictionary.result.elements[signMeta.element]} />
            <InfoRow
              label={dictionary.result.fields.modality}
              value={dictionary.result.modalities[signMeta.modality]}
            />
            <InfoRow label={dictionary.result.fields.houseMeaning} value={dictionary.result.houseMeanings[houseKey]} />
            <InfoRow
              label={dictionary.result.fields.retrograde}
              value={point.retrograde ? dictionary.common.yes : dictionary.common.no}
            />
          </dl>
        </div>
      </section>

      <section>
        <SectionLabel>{dictionary.result.panels.selectedAspect}</SectionLabel>
        {pointAspects.length > 0 ? (
          <div className="space-y-2">
            {pointAspects.map((aspect) => {
              const otherPointId = aspect.from === point.id ? aspect.to : aspect.from;
              const otherPoint = chart.points.find((entry) => entry.id === otherPointId);

              if (!otherPoint) {
                return null;
              }

              const content = (
                <>
                  <div className="min-w-0">
                    <p className="text-sm text-ivory">{dictionary.result.aspectTypes[aspect.type]}</p>
                    <p className="mt-1 text-xs text-[#3a3048]">
                      {dictionary.result.points[point.id]} / {dictionary.result.points[otherPoint.id]}
                    </p>
                    <p className="mt-1 text-xs text-[#3a3048]">
                      {dictionary.result.fields.orb}: {aspect.orb.toFixed(1)}°
                    </p>
                  </div>
                  <span className="text-xl" style={{ color: otherPoint.color }}>
                    {otherPoint.glyph}
                  </span>
                </>
              );

              if (!onSelectPoint) {
                return (
                  <div
                    key={aspect.id}
                    className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={aspect.id}
                  type="button"
                  onClick={() => onSelectPoint(otherPoint.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:border-black/15 hover:bg-black/[0.05]"
                >
                  {content}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-4 text-sm text-[#3a3048]">
            {dictionary.result.messages.noAspectSelected}
          </p>
        )}
      </section>
    </div>
  );
}
