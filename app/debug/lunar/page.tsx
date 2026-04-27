import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";

import { DebugLunarLoader } from "@/components/debug/debug-lunar-loader";
import type { AspectId, ChartPointId, SignId } from "@/lib/chart";
import { calculateNatalChart } from "@/lib/ephemeris.server";
import { getMonthlyLunarData, type MonthlyLunarData } from "@/lib/lunar.server";
import { getActiveTransits, type ActiveTransit } from "@/lib/transits.server";

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
  year: number;
  month: number;
};

const SIGN_LABELS: Record<SignId, string> = {
  aries: "Aries",
  taurus: "Tauro",
  gemini: "G\u00e9minis",
  cancer: "C\u00e1ncer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Escorpio",
  sagittarius: "Sagitario",
  capricorn: "Capricornio",
  aquarius: "Acuario",
  pisces: "Piscis",
};

const POINT_LABELS: Record<ChartPointId, string> = {
  sun: "Sol",
  moon: "Luna",
  mercury: "Mercurio",
  venus: "Venus",
  mars: "Marte",
  jupiter: "J\u00fapiter",
  saturn: "Saturno",
  uranus: "Urano",
  neptune: "Neptuno",
  pluto: "Plut\u00f3n",
  northNode: "Nodo Norte",
  southNode: "Nodo Sur",
  chiron: "Quir\u00f3n",
  partOfFortune: "Parte de la Fortuna",
  lilith: "Lilith",
};

const ASPECT_LABELS: Record<AspectId, string> = {
  conjunction: "Conjunci\u00f3n",
  sextile: "Sextil",
  square: "Cuadratura",
  trine: "Tr\u00edgono",
  quincunx: "Quincuncio",
  opposition: "Oposici\u00f3n",
};

const DEBUG_PRESETS = [
  {
    label: "Ejemplo Sarita \u00b7 Barcelona \u00b7 abril 2026",
    params: {
      name: "Ejemplo Sarita",
      birthDate: "1985-05-15",
      birthTime: "14:30",
      lat: "41.3874",
      lng: "2.1686",
      timezone: "Europe/Madrid",
      location: "Barcelona, Espa\u00f1a",
      year: "2026",
      month: "4",
    },
  },
  {
    label: "Jordi \u00b7 mes actual",
    params: {
      name: "Jordi",
      birthDate: "2001-10-23",
      birthTime: "13:05",
      lat: "39.7167",
      lng: "2.9167",
      timezone: "Europe/Madrid",
      location: "Inca, Mallorca, Espa\u00f1a",
      year: String(new Date().getUTCFullYear()),
      month: String(new Date().getUTCMonth() + 1),
    },
  },
];

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function buildInputFromSearch(params: Awaited<SearchParamsShape>): ChartInputParams | null {
  const birthDate = getSingleValue(params.birthDate);
  const birthTime = getSingleValue(params.birthTime);
  const lat = Number(getSingleValue(params.lat));
  const lng = Number(getSingleValue(params.lng));
  const timezone = getSingleValue(params.timezone);
  const name = getSingleValue(params.name) ?? "Carta debug lunar";
  const location = getSingleValue(params.location) ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const year = Number(getSingleValue(params.year)) || new Date().getUTCFullYear();
  const month = Number(getSingleValue(params.month)) || new Date().getUTCMonth() + 1;

  if (
    !birthDate ||
    !birthTime ||
    !timezone ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    Number.isNaN(year) ||
    Number.isNaN(month)
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
    year,
    month,
  };
}

function renderPresetHref(params: Record<string, string>) {
  return `/debug/lunar?${new URLSearchParams(params).toString()}`;
}

function renderCell(value: string | number | null | undefined) {
  return <td className="border border-white/15 px-3 py-2 align-top">{value ?? "-"}</td>;
}

function formatPosition(sign: SignId, degree: number, minutes: number, longitude: number) {
  return `${SIGN_LABELS[sign]} ${degree}\u00b0 ${String(minutes).padStart(2, "0")}' (${longitude.toFixed(2)}\u00b0)`;
}

function dominantTransits(transits: ActiveTransit[]) {
  const allowed = new Set<ChartPointId>([
    "saturn",
    "jupiter",
    "uranus",
    "neptune",
    "pluto",
    "mars",
    "venus",
  ]);

  return transits
    .filter((entry) => allowed.has(entry.transitingPlanet))
    .slice(0, 5);
}

function renderLunationBlock(title: string, value: MonthlyLunarData["lunaNueva"]) {
  return (
    <div className="rounded border border-white/15 bg-white/5 p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      {!value ? (
        <p className="mt-2 text-white/65">No se encontr\u00f3 una lunaci\u00f3n de este tipo para el mes indicado.</p>
      ) : (
        <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <div><dt className="text-white/55">Fecha exacta UTC</dt><dd>{value.timestamp}</dd></div>
          <div><dt className="text-white/55">Posici\u00f3n</dt><dd>{formatPosition(value.position.sign, value.position.degree, value.position.minutes, value.position.longitude)}</dd></div>
          <div><dt className="text-white/55">Casa activada</dt><dd>{value.activatedHouse}</dd></div>
          <div><dt className="text-white/55">Elemento</dt><dd>{value.element}</dd></div>
          <div><dt className="text-white/55">Rutina asignada</dt><dd>{value.assignedRoutine}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default async function DebugLunarPage({ searchParams }: DebugPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const input = buildInputFromSearch(resolvedSearchParams);

  let chart = null;
  let monthlyData: MonthlyLunarData | null = null;
  let transits: ActiveTransit[] = [];

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

    monthlyData = await getMonthlyLunarData(chart, input.year, input.month);
    transits = await getActiveTransits(chart, new Date());
  }

  const activeInput = input;

  return (
    <main className="min-h-screen bg-black px-4 py-8 font-mono text-sm text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">Debug only</p>
            <h1 className="mt-2 text-2xl font-semibold">Motor lunar \u00b7 verificaci\u00f3n</h1>
          </div>
          <Link href="/resultado" className="text-white/70 underline underline-offset-4 hover:text-white">
            Volver a resultado
          </Link>
        </div>

        {!chart || !monthlyData || !activeInput ? (
          <section className="space-y-6">
            <DebugLunarLoader />

            <div className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Presets de prueba</h2>
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
                Tambi\u00e9n puedes usar query params: <code>?birthDate=YYYY-MM-DD&amp;birthTime=HH:mm&amp;lat=...&amp;lng=...&amp;timezone=...&amp;year=...&amp;month=...</code>
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Carta base</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-white/60">Nombre</dt><dd>{chart.event.name}</dd></div>
                <div><dt className="text-white/60">Fecha natal</dt><dd>{activeInput.birthDate} {activeInput.birthTime}</dd></div>
                <div><dt className="text-white/60">Lugar</dt><dd>{chart.event.locationLabel}</dd></div>
                <div><dt className="text-white/60">Mes analizado</dt><dd>{activeInput.year}-{String(activeInput.month).padStart(2, "0")}</dd></div>
              </dl>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              {renderLunationBlock("Luna Nueva", monthlyData.lunaNueva)}
              {renderLunationBlock("Luna Llena", monthlyData.lunaLlena)}
              {monthlyData.lunaNuevaSecondary ? renderLunationBlock("Luna Nueva secundaria", monthlyData.lunaNuevaSecondary) : null}
              {monthlyData.lunaLlenaSecondary ? renderLunationBlock("Luna Llena secundaria", monthlyData.lunaLlenaSecondary) : null}
            </section>

            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Tr\u00e1nsitos activos hoy</h2>
              <table className="mt-4 min-w-full border-collapse">
                <thead>
                  <tr className="bg-white/10 text-left">
                    {["Planeta en tr\u00e1nsito", "Planeta natal", "Aspecto", "Orbe", "Exactitud", "Fuerza"].map((heading) => (
                      <th key={heading} className="border border-white/15 px-3 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-white/15 px-3 py-4 text-white/65">
                        No hay tr\u00e1nsitos activos seg\u00fan los filtros de Sarita para la fecha actual.
                      </td>
                    </tr>
                  ) : (
                    transits.map((transit) => (
                      <tr key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}-${transit.exactnessDate}`}>
                        {renderCell(POINT_LABELS[transit.transitingPlanet])}
                        {renderCell(POINT_LABELS[transit.natalPlanet])}
                        {renderCell(ASPECT_LABELS[transit.aspectType])}
                        {renderCell(transit.orb.toFixed(2))}
                        {renderCell(transit.exactnessDate)}
                        {renderCell(transit.strength)}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Tr\u00e1nsitos dominantes del mes</h2>
              <ul className="mt-4 space-y-2">
                {dominantTransits(transits).map((transit) => (
                  <li key={`${transit.transitingPlanet}-${transit.natalPlanet}-${transit.aspectType}-dominant`}>
                    {POINT_LABELS[transit.transitingPlanet]} \u2192 {POINT_LABELS[transit.natalPlanet]} \u00b7 {ASPECT_LABELS[transit.aspectType]} \u00b7 orbe {transit.orb.toFixed(2)} \u00b7 exacto {transit.exactnessDate}
                  </li>
                ))}
                {dominantTransits(transits).length === 0 ? (
                  <li className="text-white/65">No se detectaron tr\u00e1nsitos dominantes para hoy.</li>
                ) : null}
              </ul>
            </section>

            <section className="rounded border border-white/15 bg-white/5 p-4">
              <h2 className="text-lg font-semibold">Checklist del ejemplo Sarita</h2>
              <p className="mt-3 text-white/75">
                Referencia esperada del documento: Luna Nueva en Aries 27\u00b0 \u00b7 17 de abril \u00b7 Casa 4 \u00b7 elemento Fuego \u00b7 rutina fuego.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <p>Signo calculado: {monthlyData.lunaNueva ? SIGN_LABELS[monthlyData.lunaNueva.position.sign] : "-"}</p>
                <p>Grado calculado: {monthlyData.lunaNueva ? `${monthlyData.lunaNueva.position.degree}\u00b0 ${String(monthlyData.lunaNueva.position.minutes).padStart(2, "0")}'` : "-"}</p>
                <p>Casa calculada: {monthlyData.lunaNueva?.activatedHouse ?? "-"}</p>
                <p>Elemento calculado: {monthlyData.lunaNueva?.element ?? "-"}</p>
                <p>Rutina calculada: {monthlyData.lunaNueva?.assignedRoutine ?? "-"}</p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
