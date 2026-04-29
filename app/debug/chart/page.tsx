import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";

import { DebugChartLoader } from "@/components/debug/debug-chart-loader";
import {
  getAugmentedChartPoints,
  getDegreeInSign,
  getMinutesInSign,
  getSignFromLongitude,
  normalizeLongitude,
  type Aspect,
  type AspectId,
  type ChartPoint,
  type ChartPointId,
} from "@/lib/chart";
import { calculateNatalChart } from "@/lib/ephemeris.server";

export const dynamic = "force-dynamic";

type SearchParamsShape = Promise<{
  [key: string]: string | string[] | undefined;
}>;

type DebugPageProps = {
  searchParams: SearchParamsShape;
};

type ChartInputParams = {
  name: string;
  birthDate: string;
  birthTime: string;
  lat: number;
  lng: number;
  timezone: string;
  location: string;
  daylightSaving: boolean;
};

type ComparisonReference = {
  label: string;
  source: "point" | "meta";
  id: ChartPointId | "ascendant" | "mc";
  sign: ReturnType<typeof getSignFromLongitude>;
  degree: number;
  minute: number;
  retrograde?: boolean;
};

const POINT_ORDER: ChartPointId[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "northNode",
  "southNode",
  "chiron",
  "partOfFortune",
  "lilith",
];

const POINT_LABELS: Record<ChartPointId, string> = {
  sun: "Sun",
  moon: "Moon",
  mercury: "Mercury",
  venus: "Venus",
  mars: "Mars",
  jupiter: "Jupiter",
  saturn: "Saturn",
  uranus: "Uranus",
  neptune: "Neptune",
  pluto: "Pluto",
  northNode: "North Node",
  southNode: "South Node",
  chiron: "Chiron",
  partOfFortune: "Part of Fortune",
  lilith: "Lilith",
  ceres: "Ceres",
};

const SIGN_LABELS = {
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
} as const;

const SIGN_ABBR = {
  aries: "Ari",
  taurus: "Tau",
  gemini: "Gem",
  cancer: "Can",
  leo: "Leo",
  virgo: "Vir",
  libra: "Lib",
  scorpio: "Sco",
  sagittarius: "Sgr",
  capricorn: "Cap",
  aquarius: "Aqu",
  pisces: "Pis",
} as const;

const ASPECT_ANGLES: Record<AspectId, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  quincunx: 150,
  opposition: 180,
};

const ASPECT_LABELS: Record<AspectId, string> = {
  conjunction: "Conjunction",
  sextile: "Sextile",
  square: "Square",
  trine: "Trine",
  quincunx: "Quincunx",
  opposition: "Opposition",
};

const TEST_CHART_REFERENCES: ComparisonReference[] = [
  { label: "Sun", source: "point", id: "sun", sign: "scorpio", degree: 0, minute: 6 },
  { label: "Moon", source: "point", id: "moon", sign: "capricorn", degree: 22, minute: 45 },
  { label: "Mercury", source: "point", id: "mercury", sign: "libra", degree: 14, minute: 13 },
  { label: "Venus", source: "point", id: "venus", sign: "libra", degree: 9, minute: 54 },
  { label: "Mars", source: "point", id: "mars", sign: "capricorn", degree: 27, minute: 6 },
  { label: "Jupiter", source: "point", id: "jupiter", sign: "cancer", degree: 15, minute: 31 },
  { label: "Saturn", source: "point", id: "saturn", sign: "gemini", degree: 14, minute: 20, retrograde: true },
  { label: "Uranus", source: "point", id: "uranus", sign: "aquarius", degree: 20, minute: 55, retrograde: true },
  { label: "Neptune", source: "point", id: "neptune", sign: "aquarius", degree: 6, minute: 0 },
  { label: "Pluto", source: "point", id: "pluto", sign: "sagittarius", degree: 13, minute: 30 },
  { label: "True Node", source: "point", id: "northNode", sign: "gemini", degree: 29, minute: 2 },
  { label: "Chiron", source: "point", id: "chiron", sign: "sagittarius", degree: 25, minute: 14 },
  { label: "Ascendant", source: "meta", id: "ascendant", sign: "sagittarius", degree: 29, minute: 58 },
  { label: "MC", source: "meta", id: "mc", sign: "libra", degree: 22, minute: 47 },
];

const DEBUG_PRESETS = [
  {
    label: "Jordi · Inca · astro.com reference",
    params: {
      name: "Jordi",
      birthDate: "2001-10-23",
      birthTime: "13:05",
      lat: "39.7167",
      lng: "2.9167",
      timezone: "Europe/Madrid",
      location: "Inca, Mallorca, Spain",
    },
  },
  {
    label: "Midnight sample · London",
    params: {
      name: "Midnight Sample",
      birthDate: "1990-01-01",
      birthTime: "00:00",
      lat: "51.5072",
      lng: "-0.1276",
      timezone: "Europe/London",
      location: "London, United Kingdom",
    },
  },
  {
    label: "Southern hemisphere sample · Sydney",
    params: {
      name: "Sydney Sample",
      birthDate: "1988-08-17",
      birthTime: "06:42",
      lat: "-33.8688",
      lng: "151.2093",
      timezone: "Australia/Sydney",
      location: "Sydney, Australia",
    },
  },
];

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatDegreesMinutes(degree: number, minute: number) {
  return `${degree}° ${minute.toString().padStart(2, "0")}'`;
}

function formatLongitude(longitude: number) {
  return `${normalizeLongitude(longitude).toFixed(2)}°`;
}

function formatLongPosition(longitude: number) {
  const sign = getSignFromLongitude(longitude);
  const degree = getDegreeInSign(longitude);
  const minute = getMinutesInSign(longitude);

  return `${degree}° ${minute.toString().padStart(2, "0")}' ${SIGN_ABBR[sign]}`;
}

function pointArcMinutes(point: { degreeInSign: number; minutesInSign: number }) {
  return point.degreeInSign * 60 + point.minutesInSign;
}

function referenceArcMinutes(reference: ComparisonReference) {
  return reference.degree * 60 + reference.minute;
}

function buildInputFromSearch(params: Awaited<SearchParamsShape>): ChartInputParams | null {
  const birthDate = getSingleValue(params.birthDate);
  const birthTime = getSingleValue(params.birthTime);
  const lat = Number(getSingleValue(params.lat));
  const lng = Number(getSingleValue(params.lng));
  const timezone = getSingleValue(params.timezone);
  const name = getSingleValue(params.name) ?? "Carta debug";
  const location = getSingleValue(params.location) ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  if (
    !birthDate ||
    !birthTime ||
    !timezone ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return null;
  }

  const localDate = DateTime.fromISO(`${birthDate}T${birthTime}`, { zone: timezone });

  return {
    name,
    birthDate,
    birthTime,
    lat,
    lng,
    timezone,
    location,
    daylightSaving: localDate.isValid ? localDate.isInDST : false,
  };
}

function renderPresetHref(params: Record<string, string>) {
  return `/debug/chart?${new URLSearchParams(params).toString()}`;
}

function renderTableCell(value: string | number) {
  return <td className="border border-white/15 px-3 py-2 align-top">{value}</td>;
}

export default async function DebugChartPage({ searchParams }: DebugPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const input = buildInputFromSearch(resolvedSearchParams);

  let chart = null;
  if (input) {
    chart = await calculateNatalChart({
      name: input.name,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      timezone: input.timezone,
      displayLocation: input.location,
      lat: input.lat,
      lng: input.lng,
      daylightSaving: input.daylightSaving,
    });
  }

  const points = chart ? getAugmentedChartPoints(chart) : [];
  const pointMap = new Map(points.map((point) => [point.id, point]));
  const orderedPoints = POINT_ORDER.map((id) => pointMap.get(id)).filter(Boolean) as ChartPoint[];
  const orderedAspects = chart ? [...chart.aspects].sort((left, right) => left.orb - right.orb) : [];

  return (
    <main className="min-h-screen bg-black px-4 py-8 font-mono text-sm text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Debug only</p>
            <h1 className="mt-2 text-2xl font-semibold">Natal chart calculation dump</h1>
          </div>
          <Link href="/resultado" className="text-white/70 underline underline-offset-4 hover:text-white">
            Volver a resultado
          </Link>
        </div>

        {!chart ? (
          <section className="space-y-6">
            <DebugChartLoader />

            <div className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Test other charts</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {DEBUG_PRESETS.map((preset) => (
                  <Link
                    key={preset.label}
                    href={renderPresetHref(preset.params)}
                    className="rounded border border-white/15 px-3 py-2 text-white/85 hover:bg-white/10"
                  >
                    {preset.label}
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-white/70">
                También puedes abrir esta ruta con query params: <code>?birthDate=YYYY-MM-DD&amp;birthTime=HH:mm&amp;lat=…&amp;lng=…&amp;timezone=…&amp;name=…</code>
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Section 1 — Event metadata</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-white/60">Name</dt><dd>{chart.event.name}</dd></div>
                <div><dt className="text-white/60">Date</dt><dd>{input?.birthDate} {input?.birthTime}</dd></div>
                <div><dt className="text-white/60">Location</dt><dd>{chart.event.locationLabel} ({chart.event.latitude}, {chart.event.longitude})</dd></div>
                <div><dt className="text-white/60">Timezone</dt><dd>{chart.event.timezoneIdentifier} ({chart.event.utcOffset}, DST: {chart.event.daylightSaving})</dd></div>
                <div><dt className="text-white/60">Julian Day</dt><dd>{chart.event.julianDay ?? "N/D"}</dd></div>
                <div><dt className="text-white/60">House System</dt><dd>Placidus</dd></div>
                <div><dt className="text-white/60">Zodiac</dt><dd>Tropical</dd></div>
                <div><dt className="text-white/60">Node Method</dt><dd>True Node</dd></div>
              </dl>
            </section>

            <section className="overflow-x-auto rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Section 2 — Chart points table</h2>
              <p className="mt-2 text-white/65">
                The current payload returned by <code>calculateNatalChart()</code> does not expose longitude speed yet, so the Speed column is shown as <code>N/D</code> unless that field exists.
              </p>
              <table className="mt-4 min-w-full border-collapse">
                <thead>
                  <tr className="bg-white/10 text-left">
                    {["Point", "Glyph", "Sign", "Degree° Minute'", "Absolute Long.", "House", "Retrograde", "Speed"].map((heading) => (
                      <th key={heading} className="border border-white/15 px-3 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedPoints.map((point) => {
                    const speed = (point as ChartPoint & { longitudeSpeed?: number }).longitudeSpeed;
                    return (
                      <tr key={point.id}>
                        {renderTableCell(POINT_LABELS[point.id])}
                        {renderTableCell(point.glyph)}
                        {renderTableCell(SIGN_LABELS[point.sign])}
                        {renderTableCell(formatDegreesMinutes(point.degreeInSign, point.minutesInSign))}
                        {renderTableCell(formatLongitude(point.longitude))}
                        {renderTableCell(point.house)}
                        {renderTableCell(point.retrograde ? "Yes" : "No")}
                        {renderTableCell(typeof speed === "number" ? `${speed.toFixed(3)}°/day` : "N/D")}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section className="overflow-x-auto rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Section 3 — Houses table</h2>
              <table className="mt-4 min-w-full border-collapse">
                <thead>
                  <tr className="bg-white/10 text-left">
                    {["House", "Cusp Sign", "Cusp Degree° Minute'", "Absolute Long."].map((heading) => (
                      <th key={heading} className="border border-white/15 px-3 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.houses.map((house) => {
                    const sign = getSignFromLongitude(house.longitude);
                    return (
                      <tr key={house.house}>
                        {renderTableCell(house.house)}
                        {renderTableCell(SIGN_LABELS[sign])}
                        {renderTableCell(formatDegreesMinutes(getDegreeInSign(house.longitude), getMinutesInSign(house.longitude)))}
                        {renderTableCell(formatLongitude(house.longitude))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <p>Ascendant: {formatLongPosition(chart.meta.ascendant)} ({formatLongitude(chart.meta.ascendant)})</p>
                <p>Midheaven: {formatLongPosition(chart.meta.mc)} ({formatLongitude(chart.meta.mc)})</p>
                <p>Descendant: {formatLongPosition(chart.meta.descendant)} ({formatLongitude(chart.meta.descendant)})</p>
                <p>Imum Coeli: {formatLongPosition(chart.meta.ic)} ({formatLongitude(chart.meta.ic)})</p>
              </div>
            </section>

            <section className="overflow-x-auto rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Section 4 — Aspects table</h2>
              <table className="mt-4 min-w-full border-collapse">
                <thead>
                  <tr className="bg-white/10 text-left">
                    {["From", "To", "Type", "Angle°", "Orb°", "Major/Minor"].map((heading) => (
                      <th key={heading} className="border border-white/15 px-3 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderedAspects.map((aspect: Aspect) => (
                    <tr key={aspect.id}>
                      {renderTableCell(POINT_LABELS[aspect.from])}
                      {renderTableCell(POINT_LABELS[aspect.to])}
                      {renderTableCell(ASPECT_LABELS[aspect.type])}
                      {renderTableCell(ASPECT_ANGLES[aspect.type])}
                      {renderTableCell(aspect.orb.toFixed(1))}
                      {renderTableCell(aspect.type === "quincunx" ? "Minor" : "Major")}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="overflow-x-auto rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Section 5 — Astro.com comparison checklist</h2>
              <table className="mt-4 min-w-full border-collapse">
                <thead>
                  <tr className="bg-white/10 text-left">
                    {["Reference (astro.com)", "Calculated", "Match?"].map((heading) => (
                      <th key={heading} className="border border-white/15 px-3 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TEST_CHART_REFERENCES.map((reference) => {
                    const calculated =
                      reference.source === "point"
                        ? pointMap.get(reference.id as ChartPointId)
                        : {
                            sign: getSignFromLongitude(chart.meta[reference.id as "ascendant" | "mc"]),
                            degreeInSign: getDegreeInSign(chart.meta[reference.id as "ascendant" | "mc"]),
                            minutesInSign: getMinutesInSign(chart.meta[reference.id as "ascendant" | "mc"]),
                            retrograde: false,
                          };

                    const matches =
                      calculated &&
                      calculated.sign === reference.sign &&
                      Math.abs(pointArcMinutes(calculated) - referenceArcMinutes(reference)) <= 2 &&
                      (reference.retrograde === undefined || reference.retrograde === calculated.retrograde);

                    const calculatedLabel = calculated
                      ? `${formatDegreesMinutes(calculated.degreeInSign, calculated.minutesInSign)} ${SIGN_ABBR[calculated.sign]}${calculated.retrograde ? " Rx" : ""}`
                      : "Missing";

                    const referenceLabel = `${reference.label}: ${formatDegreesMinutes(reference.degree, reference.minute)} ${SIGN_ABBR[reference.sign]}${reference.retrograde ? " Rx" : ""}`;

                    return (
                      <tr key={reference.label}>
                        {renderTableCell(referenceLabel)}
                        {renderTableCell(calculatedLabel)}
                        {renderTableCell(matches ? "✅" : "❌")}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-4 text-white/70">
                Match rule: same sign and degree-minute within 2 arc-minutes (0° 02&apos;).
              </p>
            </section>

            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Test other charts</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {DEBUG_PRESETS.map((preset) => (
                  <Link
                    key={preset.label}
                    href={renderPresetHref(preset.params)}
                    className="rounded border border-white/15 px-3 py-2 text-white/85 hover:bg-white/10"
                  >
                    {preset.label}
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
