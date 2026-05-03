"use client";

import { useEffect, useMemo, useState } from "react";

import { LocationAutocomplete } from "@/components/form/location-autocomplete";
import { useStoredLocale } from "@/components/i18n/use-stored-locale";
import {
  astrocartographyCacheKey,
  astrocartographySegments,
  calculateAstrocartographyLines,
  findNearbyAstrocartographyLines,
  type AstrocartographyAngle,
  type AstrocartographyLine,
  type AstrocartographyNearbyLine,
} from "@/lib/astrocartography";
import type { ChartPointId, NatalChartData } from "@/lib/chart";
import { hashNatalChart } from "@/lib/chart-hash";
import type { FormValues } from "@/lib/chart-session";
import type { PlaceSuggestion } from "@/lib/geocoding";
import type { Dictionary } from "@/lib/i18n";
import { getCachedPremiumReading, setCachedPremiumReading } from "@/lib/premium-reading-cache";
import { normalizeReadingText } from "@/lib/reading-text";

type AstrocartographyPageProps = {
  chart: NatalChartData;
  request?: FormValues | null;
  dictionary: Dictionary;
  readingId?: string;
  gender?: string;
};

type AstrocartographyReading = {
  summaryTitle: string;
  summaryBody: string;
  pros: string[];
  cautions: string[];
  practicalFocus: string;
};

const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const satisfies ChartPointId[];
type AstrocartographyPlanetId = (typeof PLANETS)[number];
const ANGLES: AstrocartographyAngle[] = ["AC", "DC", "MC", "IC"];
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const READING_TIMEOUT_MS = 45000;

function projectPoint(point: { lat: number; lng: number }) {
  return {
    x: ((point.lng + 180) / 360) * MAP_WIDTH,
    y: ((90 - point.lat) / 180) * MAP_HEIGHT,
  };
}

function linePath(points: Array<{ lat: number; lng: number }>) {
  return points.map((point, index) => {
    const projected = projectPoint(point);
    return `${index === 0 ? "M" : "L"} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
  }).join(" ");
}

function viewBoxForLocation(location: PlaceSuggestion | null) {
  if (!location) return `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
  const projected = projectPoint(location);
  const width = 430;
  const height = 245;
  const x = Math.min(Math.max(0, projected.x - width / 2), MAP_WIDTH - width);
  const y = Math.min(Math.max(0, projected.y - height / 2), MAP_HEIGHT - height);
  return `${x} ${y} ${width} ${height}`;
}

function normalizeReading(data: AstrocartographyReading): AstrocartographyReading {
  return {
    summaryTitle: normalizeReadingText(data.summaryTitle),
    summaryBody: normalizeReadingText(data.summaryBody),
    pros: data.pros.map(normalizeReadingText),
    cautions: data.cautions.map(normalizeReadingText),
    practicalFocus: normalizeReadingText(data.practicalFocus),
  };
}

function localizedLine(line: AstrocartographyNearbyLine, copy: Dictionary["result"]["astrocartographyPage"]): AstrocartographyNearbyLine {
  const planetLabels: Partial<Record<ChartPointId, string>> = copy.planets;

  return {
    ...line,
    planetLabel: planetLabels[line.planetId] ?? line.planetLabel,
  };
}

function influenceLabel(influence: AstrocartographyNearbyLine["influence"], copy: Dictionary["result"]["astrocartographyPage"]) {
  if (influence === "strong") return copy.influenceStrong;
  if (influence === "noticeable") return copy.influenceNoticeable;
  return copy.influenceBackground;
}

function WorldMap({
  lines,
  selectedLocation,
  selectedLineId,
  onLineSelect,
  copy,
}: {
  lines: AstrocartographyLine[];
  selectedLocation: PlaceSuggestion | null;
  selectedLineId: string | null;
  onLineSelect: (lineId: string) => void;
  copy: Dictionary["result"]["astrocartographyPage"];
}) {
  const selectedPoint = selectedLocation ? projectPoint(selectedLocation) : null;

  return (
    <svg
      viewBox={viewBoxForLocation(selectedLocation)}
      role="img"
      aria-label={copy.mapAria}
      className="h-full min-h-[420px] w-full bg-[#f6f0e4] transition-all duration-500"
    >
      <defs>
        <pattern id="acg-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(58,48,72,0.1)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#f4eddf" />
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#acg-grid)" />
      <path
        d="M146 139 L218 115 L282 139 L335 128 L372 171 L334 206 L262 201 L209 223 L160 194 Z
           M438 121 L525 98 L622 126 L662 178 L614 213 L526 202 L464 234 L406 198 Z
           M703 151 L792 125 L886 153 L923 214 L858 255 L756 236 L706 202 Z
           M476 253 L542 242 L585 294 L559 365 L503 414 L466 348 Z
           M734 303 L829 291 L907 334 L882 395 L785 409 L724 364 Z
           M255 270 L319 266 L347 340 L305 425 L242 391 Z"
        fill="rgba(138,122,78,0.18)"
        stroke="rgba(92,74,36,0.22)"
        strokeWidth="2"
      />
      {[0, 250, 500, 750, 1000].map((x) => (
        <path key={`meridian-${x}`} d={`M ${x} 0 L ${x} ${MAP_HEIGHT}`} stroke="rgba(58,48,72,0.08)" strokeWidth="1" />
      ))}
      {[83, 167, 250, 333, 417].map((y) => (
        <path key={`parallel-${y}`} d={`M 0 ${y} L ${MAP_WIDTH} ${y}`} stroke="rgba(58,48,72,0.08)" strokeWidth="1" />
      ))}
      {lines.map((line) => (
        <g key={line.id}>
          {astrocartographySegments(line).map((segment, index) => (
            <path
              key={`${line.id}-${index}`}
              d={linePath(segment)}
              fill="none"
              stroke={line.color}
              strokeWidth={selectedLineId === line.id ? 4 : 2.15}
              strokeOpacity={selectedLineId && selectedLineId !== line.id ? 0.28 : 0.82}
              strokeDasharray={line.angle === "IC" || line.angle === "DC" ? "7 5" : undefined}
              onClick={() => onLineSelect(line.id)}
              className="cursor-pointer transition"
            />
          ))}
        </g>
      ))}
      {selectedPoint ? (
        <g>
          <circle cx={selectedPoint.x} cy={selectedPoint.y} r="11" fill="rgba(58,48,72,0.16)" />
          <circle cx={selectedPoint.x} cy={selectedPoint.y} r="5" fill="#3a3048" stroke="#f6f0e4" strokeWidth="2" />
        </g>
      ) : null}
    </svg>
  );
}

export function AstrocartographyPage({ chart, request = null, dictionary, readingId, gender }: AstrocartographyPageProps) {
  const locale = useStoredLocale();
  const copy = dictionary.result.astrocartographyPage;
  const [chartHash, setChartHash] = useState<string | null>(null);
  const [lines, setLines] = useState<AstrocartographyLine[]>([]);
  const [visiblePlanets, setVisiblePlanets] = useState<Set<ChartPointId>>(() => new Set(PLANETS));
  const [visibleAngles, setVisibleAngles] = useState<Set<AstrocartographyAngle>>(() => new Set(ANGLES));
  const [city, setCity] = useState(request?.selectedLocation?.displayName ?? "");
  const [selectedLocation, setSelectedLocation] = useState<PlaceSuggestion | null>(request?.selectedLocation ?? null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [reading, setReading] = useState<AstrocartographyReading | null>(null);
  const [readingError, setReadingError] = useState<string | null>(null);
  const [isLoadingReading, setIsLoadingReading] = useState(false);

  useEffect(() => {
    let active = true;
    void hashNatalChart(chart).then((hash) => {
      if (active) setChartHash(hash);
    });
    return () => {
      active = false;
    };
  }, [chart]);

  useEffect(() => {
    if (!chartHash) return;
    const cacheKey = astrocartographyCacheKey(chart);
    const cachedLines = getCachedPremiumReading<AstrocartographyLine[]>(chartHash, cacheKey);
    if (cachedLines) {
      setLines(cachedLines);
      return;
    }

    const calculated = calculateAstrocartographyLines(chart);
    setLines(calculated);
    setCachedPremiumReading(chartHash, cacheKey, calculated);
  }, [chart, chartHash]);

  const filteredLines = useMemo(
    () => lines.filter((line) => visiblePlanets.has(line.planetId) && visibleAngles.has(line.angle)),
    [lines, visibleAngles, visiblePlanets],
  );

  const nearbyLines = useMemo(() => {
    if (!selectedLocation) return [];
    return findNearbyAstrocartographyLines(lines, selectedLocation, 6).map((line) => localizedLine(line, copy));
  }, [copy, lines, selectedLocation]);

  useEffect(() => {
    if (!selectedLocation || !chartHash || nearbyLines.length === 0) return;
    const cacheKey = `astrocartography:${selectedLocation.lat.toFixed(3)}:${selectedLocation.lng.toFixed(3)}:${locale}:${gender || "unspecified"}:${nearbyLines.map((line) => line.lineId).join("|")}`;
    const cached = getCachedPremiumReading<AstrocartographyReading>(chartHash, cacheKey);
    if (cached) {
      setReading(normalizeReading(cached));
      setReadingError(null);
      setIsLoadingReading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), READING_TIMEOUT_MS);
    setReading(null);
    setReadingError(null);
    setIsLoadingReading(true);

    void fetch("/api/astrocartography-reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart,
        location: {
          displayName: selectedLocation.displayName,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          country: selectedLocation.country,
        },
        nearbyLines,
        locale,
        readingId,
        cacheKey,
        gender,
      }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        setReadingError(`${copy.readingError} (${response.status})`);
        return;
      }
      const payload = normalizeReading(await response.json() as AstrocartographyReading);
      setReading(payload);
      setCachedPremiumReading(chartHash, cacheKey, payload);
    }).catch(() => {
      setReadingError(copy.readingError);
    }).finally(() => {
      window.clearTimeout(timeout);
      setIsLoadingReading(false);
    });

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [chart, chartHash, copy, gender, locale, nearbyLines, readingId, selectedLocation]);

  function togglePlanet(planet: AstrocartographyPlanetId) {
    setVisiblePlanets((current) => {
      const next = new Set(current);
      if (next.has(planet)) next.delete(planet);
      else next.add(planet);
      return next;
    });
  }

  function toggleAngle(angle: AstrocartographyAngle) {
    setVisibleAngles((current) => {
      const next = new Set(current);
      if (next.has(angle)) next.delete(angle);
      else next.add(angle);
      return next;
    });
  }

  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="text-center">
        <p className="font-serif text-[15px] italic lowercase tracking-[0.15em] text-[#5c4a24]">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-[42px] leading-tight text-ivory md:text-[56px]">
          {copy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#3a3048]">
          {copy.description}
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 overflow-hidden border border-black/10 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.1)]">
          <div className="border-b border-black/10 p-4">
            <LocationAutocomplete
              value={city}
              selectedLocation={selectedLocation}
              onInputChange={(value) => {
                setCity(value);
                setSelectedLocation(null);
              }}
              onSelect={(place) => {
                setCity(place.displayName);
                setSelectedLocation(place);
              }}
              dictionary={dictionary}
            />
          </div>
          <WorldMap
            lines={filteredLines}
            selectedLocation={selectedLocation}
            selectedLineId={selectedLineId}
            onLineSelect={setSelectedLineId}
            copy={copy}
          />
        </div>

        <aside className="border border-black/10 bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
            {copy.panelEyebrow}
          </p>
          <h3 className="mt-2 font-serif text-[28px] leading-tight text-ivory">
            {selectedLocation?.displayName ?? copy.panelTitle}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[#3a3048]">
            {selectedLocation ? copy.panelSelectedBody : copy.panelEmptyBody}
          </p>

          {nearbyLines.length ? (
            <div className="mt-5 space-y-2">
              {nearbyLines.map((line) => (
                <button
                  key={line.lineId}
                  type="button"
                  onClick={() => setSelectedLineId(line.lineId)}
                  className={[
                    "flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition",
                    selectedLineId === line.lineId ? "border-dusty-gold/55 bg-dusty-gold/[0.08]" : "border-black/10 hover:bg-black/[0.03]",
                  ].join(" ")}
                >
                  <span className="text-sm text-[#3a3048]">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                    {line.planetLabel} {line.angle}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7a4e]">
                    {line.distanceKm} km
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {nearbyLines[0] ? (
            <p className="mt-3 text-xs leading-5 text-[#5c4a24]">
              {copy.closestLine}: {nearbyLines[0].planetLabel} {nearbyLines[0].angle}, {influenceLabel(nearbyLines[0].influence, copy)}
            </p>
          ) : null}

          <div className="mt-6 border-t border-black/10 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">
              {copy.readingEyebrow}
            </p>
            {isLoadingReading ? (
              <div className="mt-4 animate-pulse space-y-3">
                <div className="h-6 w-3/4 bg-black/8" />
                <div className="h-3 w-full bg-black/6" />
                <div className="h-3 w-5/6 bg-black/6" />
                <div className="h-3 w-2/3 bg-black/6" />
              </div>
            ) : readingError ? (
              <p className="mt-3 text-sm leading-7 text-red-700">{readingError}</p>
            ) : reading ? (
              <div className="mt-3">
                <h4 className="font-serif text-[22px] leading-snug text-ivory">{reading.summaryTitle}</h4>
                <p className="mt-3 text-sm leading-7 text-[#3a3048]">{reading.summaryBody}</p>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">{copy.prosTitle}</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#3a3048]">
                  {reading.pros.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7a4e]">{copy.cautionsTitle}</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#3a3048]">
                  {reading.cautions.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <p className="mt-5 text-sm leading-7 text-[#5c4a24]">{reading.practicalFocus}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[#3a3048]">{copy.readingPlaceholder}</p>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap gap-2">
          {PLANETS.map((planet) => {
            const active = visiblePlanets.has(planet);
            const line = lines.find((entry) => entry.planetId === planet);
            return (
              <button
                key={planet}
                type="button"
                onClick={() => togglePlanet(planet)}
                className={[
                  "rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition",
                  active ? "border-dusty-gold/50 bg-dusty-gold/[0.08] text-[#5c4a24]" : "border-black/10 bg-white/70 text-[#3a3048]",
                ].join(" ")}
              >
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line?.color ?? "#8a7a4e" }} />
                {copy.planets[planet]}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {ANGLES.map((angle) => {
            const active = visibleAngles.has(angle);
            return (
              <button
                key={angle}
                type="button"
                onClick={() => toggleAngle(angle)}
                className={[
                  "rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
                  active ? "border-dusty-gold/50 bg-white text-[#5c4a24]" : "border-black/10 bg-white/60 text-[#3a3048]",
                ].join(" ")}
              >
                {copy.angles[angle]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
