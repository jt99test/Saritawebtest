import { DateTime } from "luxon";
import SwissEph from "swisseph-wasm";

import { calculateNatalChart } from "../lib/ephemeris.server";
import {
  getDegreeInSign,
  getMinutesInSign,
  getSignFromLongitude,
  normalizeLongitude,
  type ChartPointId,
  type NatalChartData,
} from "../lib/chart";

const SE_MEAN_NODE = 10;
const SE_TRUE_NODE = 11;
const SEFLG_SPEED = 256;
const SEFLG_SWIEPH = 2;

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

const SUBJECTS = [
  {
    name: "Jordi",
    birthDate: "2001-10-23",
    birthTime: "13:05",
    timezone: "Europe/Madrid",
    displayLocation: "Inca, Mallorca, Spain",
    lat: 39.7211,
    lng: 2.9089,
    daylightSaving: true,
  },
  {
    name: "Sarita",
    birthDate: "1973-03-13",
    birthTime: "19:17",
    timezone: "Europe/Rome",
    displayLocation: "Milán, Italy",
    lat: 45.4642,
    lng: 9.19,
    daylightSaving: false,
  },
  {
    name: "Akari",
    birthDate: "1995-08-07",
    birthTime: "06:42",
    timezone: "Asia/Tokyo",
    displayLocation: "Tokyo, Japan",
    lat: 35.6762,
    lng: 139.6503,
    daylightSaving: false,
  },
  {
    name: "Marcus",
    birthDate: "1988-07-04",
    birthTime: "14:30",
    timezone: "America/New_York",
    displayLocation: "New York, NY, USA",
    lat: 40.7128,
    lng: -74.006,
    daylightSaving: true,
  },
  {
    name: "Elena",
    birthDate: "1979-06-21",
    birthTime: "23:15",
    timezone: "America/Argentina/Buenos_Aires",
    displayLocation: "Buenos Aires, Argentina",
    lat: -34.6037,
    lng: -58.3816,
    daylightSaving: false,
  },
  {
    name: "Henrik",
    birthDate: "1968-05-14",
    birthTime: "04:55",
    timezone: "Europe/Stockholm",
    displayLocation: "Stockholm, Sweden",
    lat: 59.3293,
    lng: 18.0686,
    daylightSaving: false,
  },
] as const;

const BODY_ROWS: Array<{ id: ChartPointId; label: string }> = [
  { id: "sun", label: "Sun" },
  { id: "moon", label: "Moon" },
  { id: "mercury", label: "Mercury" },
  { id: "venus", label: "Venus" },
  { id: "mars", label: "Mars" },
  { id: "jupiter", label: "Jupiter" },
  { id: "saturn", label: "Saturn" },
  { id: "uranus", label: "Uranus" },
  { id: "neptune", label: "Neptune" },
  { id: "pluto", label: "Pluto" },
  { id: "chiron", label: "Chiron" },
];

function formatOffset(minutes: number) {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(
    absolute % 60,
  ).padStart(2, "0")}`;
}

function formatPosition(longitude: number, retrograde?: unknown) {
  const normalized = normalizeLongitude(longitude);
  const sign = SIGN_ABBR[getSignFromLongitude(normalized)];
  const degree = String(getDegreeInSign(normalized)).padStart(2, "0");
  const minutes = String(getMinutesInSign(normalized)).padStart(2, "0");
  return `${degree}° ${sign} ${minutes}'${retrograde ? " Rx" : ""}`;
}

function row(label: string, value: string) {
  return `${label.padEnd(10, " ")} | ${value}`;
}

async function getNodeLongitudes(julianDay: number) {
  const se = new SwissEph();
  await se.initSwissEph();
  const flags = SEFLG_SPEED | SEFLG_SWIEPH;
  const meanNode = se.calc_ut(julianDay, SE_MEAN_NODE, flags) as Float64Array;
  const trueNode = se.calc_ut(julianDay, SE_TRUE_NODE, flags) as Float64Array;
  return {
    mean: normalizeLongitude(meanNode[0]!),
    true: normalizeLongitude(trueNode[0]!),
  };
}

function pointMap(chart: NatalChartData) {
  return new Map(chart.points.map((point) => [point.id, point] as const));
}

async function main() {
  const lines: string[] = ["===== CHART AUDIT =====", ""];

  for (const [index, subject] of SUBJECTS.entries()) {
    const chart = await calculateNatalChart(subject);
    const points = pointMap(chart);
    const localTime = DateTime.fromISO(`${subject.birthDate}T${subject.birthTime}:00`, {
      zone: subject.timezone,
    });
    const utcTime = localTime.toUTC();
    const julianDay = Number(chart.event.julianDay);
    const nodes = await getNodeLongitudes(julianDay);

    lines.push(`--- Subject ${index + 1}: ${subject.name} ---`);
    lines.push(`Local time:        ${subject.birthDate} ${subject.birthTime} ${subject.timezone}`);
    lines.push(`Resolved UTC offset: ${formatOffset(localTime.offset)}`);
    lines.push(`UTC time:          ${utcTime.toFormat("yyyy-LL-dd HH:mm")}`);
    lines.push(`Julian Day:        ${julianDay.toFixed(5)}`);
    lines.push("");

    for (const body of BODY_ROWS) {
      const point = points.get(body.id);
      if (point) {
        lines.push(row(body.label, formatPosition(point.longitude, point.retrograde)));
      }
    }

    lines.push(row("Mean Node", formatPosition(nodes.mean)));
    lines.push(row("True Node", formatPosition(nodes.true)));

    const lilith = points.get("lilith");
    if (lilith) {
      lines.push(row("Lilith", formatPosition(lilith.longitude, lilith.retrograde)));
    }

    lines.push(row("Ascendant", formatPosition(chart.meta.ascendant)));
    lines.push(row("MC", formatPosition(chart.meta.mc)));
    lines.push("");
    lines.push("Retrograde flags raw:");

    for (const body of BODY_ROWS) {
      const point = points.get(body.id);
      lines.push(`  ${body.label}: ${String(point?.retrograde)}`);
    }

    lines.push("");
  }

  lines.push("===== END AUDIT =====");
  process.stdout.write(lines.join("\n"));
}

void main();
