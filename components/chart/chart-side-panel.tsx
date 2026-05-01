"use client";

import type { Dictionary } from "@/lib/i18n";
import type { NatalChartData } from "@/lib/chart";
import { formatSignPosition, getAugmentedChartPoints, zodiacSigns } from "@/lib/chart";

import { ChartPointDataCard } from "@/components/chart/chart-point-datacard";
import { useChartStore } from "@/components/chart/chart-store";
import { PremiumCard } from "@/components/ui/premium-card";

type ChartSidePanelProps = {
  chart: NatalChartData;
  dictionary: Dictionary;
};

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.3em] text-[#6f613a]">
        {children}
      </p>
      <div className="h-px w-full bg-gradient-to-r from-white/12 to-transparent" />
    </div>
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-2.5">
      <dt className="text-sm text-[#3a3048]">{label}</dt>
      <dd className="text-right text-sm text-ivory">{value}</dd>
    </div>
  );
}

function PanelCard({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.6rem] border border-black/10 bg-black/[0.04]",
        compact ? "px-3 py-2" : "px-4 py-3",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function formatChartPosition(dictionary: Dictionary, longitude: number) {
  const position = formatSignPosition(longitude);
  const glyph = zodiacSigns.find((sign) => sign.id === position.sign)?.glyph ?? "";
  return `${position.degreeLabel} ${glyph} · ${dictionary.result.signs[position.sign]}`;
}

function houseLabel(dictionary: Dictionary, house: number) {
  const houseKey = String(house) as keyof typeof dictionary.result.houseMeanings;
  return `${dictionary.result.fields.house} ${house} · ${dictionary.result.houseMeanings[houseKey]}`;
}

export function ChartSidePanel({ chart, dictionary }: ChartSidePanelProps) {
  const {
    activePanel,
    selectedPointId,
    showAspects,
    showMinorPoints,
    selectPoint,
    setActivePanel,
    toggleAspects,
    toggleMinorPoints,
  } = useChartStore();

  const augmentedPoints = getAugmentedChartPoints(chart);
  const selectedPoint = augmentedPoints.find((point) => point.id === selectedPointId) ?? augmentedPoints[0]!;
  const visiblePoints = augmentedPoints.filter((point) =>
    showMinorPoints ? true : point.id !== "northNode" && point.id !== "chiron",
  );
  const visiblePointIds = new Set(visiblePoints.map((point) => point.id));
  const visibleAspects = chart.aspects.filter(
    (aspect) => visiblePointIds.has(aspect.from) && visiblePointIds.has(aspect.to),
  );
  const angles = [
    { id: "ascendant", short: "AC", longitude: chart.meta.ascendant },
    { id: "mc", short: "MC", longitude: chart.meta.mc },
    { id: "descendant", short: "DC", longitude: chart.meta.descendant },
    { id: "ic", short: "IC", longitude: chart.meta.ic },
  ] as const;

  return (
    <PremiumCard className="overflow-hidden border-black/15 bg-[linear-gradient(180deg,rgba(10,12,20,0.9),rgba(8,10,18,0.78))] shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl xl:sticky xl:top-6">
      <div className="border-b border-black/10 px-5 py-4">
        <div className="inline-flex rounded-full border border-black/10 bg-white/70 p-1">
          {(["details", "settings"] as const).map((panel) => {
            const active = activePanel === panel;

            return (
              <button
                key={panel}
                type="button"
                onClick={() => setActivePanel(panel)}
                className={[
                  "rounded-full px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.22em] transition",
                  active ? "bg-white text-cosmic-950" : "text-[#3a3048] hover:text-ivory",
                ].join(" ")}
              >
                {dictionary.result.panels[panel]}
              </button>
            );
          })}
        </div>
      </div>

      {activePanel === "details" ? (
        <div className="space-y-8 px-5 py-5">
          <section>
            <ChartPointDataCard
              chart={chart}
              point={selectedPoint}
              dictionary={dictionary}
              onSelectPoint={selectPoint}
            />
            <p className="mt-3 text-sm leading-6 text-[#3a3048]">{dictionary.result.messages.detailsHint}</p>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.allPoints}</SectionLabel>
            <div className="mt-4 space-y-2">
              {visiblePoints.map((point) => {
                const active = point.id === selectedPoint.id;

                return (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => selectPoint(point.id)}
                    className={[
                      "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
                      active
                        ? "border-black/15 bg-white/[0.07]"
                        : "border-black/10 bg-white hover:border-black/15 hover:bg-black/[0.04]",
                    ].join(" ")}
                  >
                    <div>
                      <p className="text-sm text-ivory">{dictionary.result.points[point.id]}</p>
                      <p className="mt-1 text-xs text-[#3a3048]">
                        {formatChartPosition(dictionary, point.longitude)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[1.35rem]" style={{ color: point.color }}>
                        {point.glyph}
                      </span>
                      <span className="text-[12px] uppercase tracking-[0.22em] text-[#3a3048]">
                        {point.house}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-8 px-5 py-5">
          <section>
            <SectionLabel>{dictionary.result.panels.overview}</SectionLabel>
            <dl className="mt-4 divide-y divide-black/10 rounded-[1.6rem] border border-black/10 bg-white/700 px-4">
              <InfoRow
                label={dictionary.result.fields.chartMethod}
                value={dictionary.result.settingsValues[chart.settings.chartMethod]}
              />
              <InfoRow
                label={dictionary.result.fields.calculationMethod}
                value={dictionary.result.settingsValues[chart.settings.calculationMethod]}
              />
              <InfoRow
                label={dictionary.result.fields.zodiac}
                value={dictionary.result.settingsValues[chart.settings.zodiac]}
              />
              <InfoRow
                label={dictionary.result.fields.houseSystem}
                value={dictionary.result.settingsValues[chart.settings.houseSystem]}
              />
              <InfoRow
                label={dictionary.result.fields.locus}
                value={dictionary.result.settingsValues[chart.settings.locus]}
              />
              {chart.event.julianDay ? (
                <InfoRow label={dictionary.result.fields.julianDay} value={chart.event.julianDay} />
              ) : null}
            </dl>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.event}</SectionLabel>
            <dl className="mt-4 divide-y divide-black/10 rounded-[1.6rem] border border-black/10 bg-white/700 px-4">
              <InfoRow label={dictionary.result.fields.date} value={chart.event.dateLabel} />
              <InfoRow label={dictionary.result.fields.location} value={chart.event.locationLabel} />
              <InfoRow label={dictionary.result.fields.latitude} value={chart.event.latitude} />
              <InfoRow label={dictionary.result.fields.longitude} value={chart.event.longitude} />
              <InfoRow label={dictionary.result.fields.utcOffset} value={chart.event.utcOffset} />
              <InfoRow label={dictionary.result.fields.timezone} value={chart.event.timezone} />
              <InfoRow label={dictionary.result.fields.daylightSaving} value={chart.event.daylightSaving} />
              <InfoRow
                label={dictionary.result.fields.timezoneIdentifier}
                value={chart.event.timezoneIdentifier}
              />
            </dl>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.angles}</SectionLabel>
            <div className="mt-4 grid gap-3">
              {angles.map((angle) => (
                <PanelCard key={angle.id} compact>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f613a]">
                        {dictionary.result.fields[angle.id]}
                      </p>
                      <p className="mt-1 text-sm text-ivory">{formatChartPosition(dictionary, angle.longitude)}</p>
                    </div>
                    <span className="rounded-full border border-black/10 bg-black/[0.05] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
                      {angle.short}
                    </span>
                  </div>
                </PanelCard>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.positions}</SectionLabel>
            <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-black/10 bg-white">
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] gap-3 border-b border-black/10 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
                <span>{dictionary.result.fields.point}</span>
                <span>{dictionary.result.fields.sign}</span>
                <span>{dictionary.result.fields.house}</span>
                <span>{dictionary.result.fields.retrogradeShort}</span>
              </div>
              {visiblePoints.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => selectPoint(point.id)}
                  className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto] gap-3 border-b border-black/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-black/[0.04]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ivory">{dictionary.result.points[point.id]}</span>
                    <span className="mt-1 block text-xs text-[#3a3048]">{point.glyph}</span>
                  </span>
                  <span className="text-sm text-ivory/78">{formatChartPosition(dictionary, point.longitude)}</span>
                  <span className="text-sm text-[#3a3048]">{point.house}</span>
                  <span className="text-sm text-[#3a3048]">{point.retrograde ? "Rx" : "—"}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.aspectSummary}</SectionLabel>
            {visibleAspects.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-black/10 bg-white">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-black/10 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#3a3048]">
                  <span>{dictionary.result.fields.aspect}</span>
                  <span>{dictionary.result.fields.orb}</span>
                  <span>{dictionary.result.fields.pointsPair}</span>
                </div>
                {visibleAspects
                  .slice()
                  .sort((left, right) => left.orb - right.orb)
                  .map((aspect) => {
                    const fromPoint = chart.points.find((point) => point.id === aspect.from);
                    const toPoint = chart.points.find((point) => point.id === aspect.to);

                    if (!fromPoint || !toPoint) {
                      return null;
                    }

                    return (
                      <button
                        key={aspect.id}
                        type="button"
                        onClick={() => selectPoint(aspect.from)}
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-b border-black/10 px-4 py-3 text-left transition last:border-b-0 hover:bg-black/[0.04]"
                      >
                        <span className="min-w-0 text-sm text-ivory">
                          {dictionary.result.aspectTypes[aspect.type]}
                        </span>
                        <span className="text-sm text-[#3a3048]">{aspect.orb.toFixed(1)}°</span>
                        <span className="text-xs text-[#3a3048]">
                          {dictionary.result.points[aspect.from]} / {dictionary.result.points[aspect.to]}
                        </span>
                      </button>
                    );
                  })}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-black/10 px-4 py-4 text-sm text-[#3a3048]">
                {dictionary.result.messages.noAspectSelected}
              </p>
            )}
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.aspectMatrix}</SectionLabel>
            <div className="mt-4 overflow-x-auto rounded-[1.6rem] border border-black/10 bg-white">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-[#3a3048]">
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-[0.22em]">
                      {dictionary.result.fields.point}
                    </th>
                    {visiblePoints.map((point) => (
                      <th
                        key={`head-${point.id}`}
                        className="min-w-10 px-2 py-3 text-center font-semibold uppercase tracking-[0.22em]"
                        title={dictionary.result.points[point.id]}
                      >
                        {point.glyph}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePoints.map((rowPoint) => (
                    <tr key={`row-${rowPoint.id}`} className="border-b border-black/10 last:border-b-0">
                      <th className="px-3 py-3 text-left font-medium text-[#3a3048]">
                        {dictionary.result.points[rowPoint.id]}
                      </th>
                      {visiblePoints.map((columnPoint) => {
                        if (rowPoint.id === columnPoint.id) {
                          return (
                            <td key={`${rowPoint.id}-${columnPoint.id}`} className="px-2 py-3 text-center text-ivory/24">
                              •
                            </td>
                          );
                        }

                        const aspect = visibleAspects.find(
                          (entry) =>
                            (entry.from === rowPoint.id && entry.to === columnPoint.id) ||
                            (entry.from === columnPoint.id && entry.to === rowPoint.id),
                        );

                        return (
                          <td
                            key={`${rowPoint.id}-${columnPoint.id}`}
                            className="px-2 py-3 text-center text-[#3a3048]"
                            title={
                              aspect
                                ? `${dictionary.result.aspectTypes[aspect.type]} · ${aspect.orb.toFixed(1)}°`
                                : dictionary.result.messages.noAspectMatrix
                            }
                          >
                            {aspect ? dictionary.result.aspectSymbols[aspect.type] : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.houseCusps}</SectionLabel>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {chart.houses.map((house) => (
                <PanelCard key={house.house} compact>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ivory">{houseLabel(dictionary, house.house)}</p>
                      <p className="mt-1 text-xs text-[#3a3048]">
                        {formatChartPosition(dictionary, house.longitude)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f613a]">
                      {house.house}
                    </span>
                  </div>
                </PanelCard>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>{dictionary.result.panels.filters}</SectionLabel>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: dictionary.result.toggles.aspects,
                  active: showAspects,
                  onToggle: toggleAspects,
                },
                {
                  label: dictionary.result.toggles.minorPoints,
                  active: showMinorPoints,
                  onToggle: toggleMinorPoints,
                },
              ].map((toggle) => (
                <button
                  key={toggle.label}
                  type="button"
                  onClick={toggle.onToggle}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left transition hover:border-black/15 hover:bg-black/[0.05]"
                >
                  <div>
                    <p className="text-sm text-ivory">{toggle.label}</p>
                    <p className="mt-1 text-xs text-[#3a3048]">
                      {toggle.active ? dictionary.common.show : dictionary.common.hide}
                    </p>
                  </div>
                  <span
                    className={[
                      "relative h-6 w-11 rounded-full transition",
                      toggle.active ? "bg-dusty-gold/85" : "bg-white/14",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-1 h-4 w-4 rounded-full bg-white transition",
                        toggle.active ? "left-6" : "left-1",
                      ].join(" ")}
                    />
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#3a3048]">{dictionary.result.messages.settingsHint}</p>
          </section>
        </div>
      )}
    </PremiumCard>
  );
}
