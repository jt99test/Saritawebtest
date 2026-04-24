export type GeoResult = {
  displayName: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  daylightSaving: boolean;
};

export type PlaceSuggestion = GeoResult & {
  id: string;
};

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    province?: string;
    region?: string;
    country?: string;
    country_code?: string;
  };
};

function deriveLocationParts(result: NominatimResult, fallbackQuery = "") {
  const address = result.address ?? {};
  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    fallbackQuery.split(",")[0]?.trim() ??
    "Lugar desconocido";

  const region = address.state ?? address.province ?? address.region ?? "";
  const country = address.country ?? "";
  const countryCode = (address.country_code ?? "").toLowerCase();

  return { city, region, country, countryCode };
}

async function resolveGeoResult(result: NominatimResult, fallbackQuery = ""): Promise<GeoResult> {
  const lat = parseFloat(result.lat);
  const lng = parseFloat(result.lon);
  const { city, region, country } = deriveLocationParts(result, fallbackQuery);
  const displayParts = [city];

  if (region && region !== city) {
    displayParts.push(region);
  }

  if (country) {
    displayParts.push(country);
  }

  const timezone = await getTimezone(lat, lng);
  const daylightSaving = isDaylightSavingTime(timezone);

  return {
    displayName: displayParts.join(", "),
    city,
    region,
    country,
    lat,
    lng,
    timezone,
    daylightSaving,
  };
}

function isDaylightSavingTime(timezone: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(now);
  const tzAbbr = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  return /DT|BST|IST|CEST|EEST|PDT|MDT|CDT|EDT/.test(tzAbbr);
}

function sortSuggestions(results: NominatimResult[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return [...results].sort((left, right) => {
    const leftParts = deriveLocationParts(left, query);
    const rightParts = deriveLocationParts(right, query);

    const score = (countryCode: string, city: string) => {
      let total = 0;
      if (countryCode === "es") total += 100;
      else if (countryCode === "it") total += 75;
      else total += 10;

      if (city.toLowerCase() === normalizedQuery) total += 40;
      else if (city.toLowerCase().startsWith(normalizedQuery)) total += 24;
      else if (city.toLowerCase().includes(normalizedQuery)) total += 12;

      return total;
    };

    return score(rightParts.countryCode, rightParts.city) - score(leftParts.countryCode, leftParts.city);
  });
}

async function fetchNominatim(query: string, limit: number) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "SARITA-Astrology/1.0 (contact@sarita.app)",
      "Accept-Language": "es,en",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  return (await response.json()) as NominatimResult[];
}

export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const rawResults = await fetchNominatim(trimmedQuery, 8);
  const sortedResults = sortSuggestions(rawResults, trimmedQuery).slice(0, 6);
  const suggestions = await Promise.all(
    sortedResults.map(async (result) => {
      const geo = await resolveGeoResult(result, trimmedQuery);
      return {
        id: String(result.place_id),
        ...geo,
      };
    }),
  );

  return suggestions;
}

export async function geocode(query: string): Promise<GeoResult> {
  const suggestions = await suggestPlaces(query);
  const selected = suggestions[0];

  if (!selected) {
    throw new Error("Location not found");
  }

  return {
    displayName: selected.displayName,
    city: selected.city,
    region: selected.region,
    country: selected.country,
    lat: selected.lat,
    lng: selected.lng,
    timezone: selected.timezone,
    daylightSaving: selected.daylightSaving,
  };
}

async function getTimezone(lat: number, lng: number): Promise<string> {
  try {
    const { find } = await import("geo-tz");
    const zones = find(lat, lng);
    if (zones.length) {
      return zones[0]!;
    }
  } catch {
    // fall through to rough fallback
  }

  const offset = Math.round(lng / 15);
  if (offset === 0) {
    return "UTC";
  }

  const sign = offset > 0 ? "+" : "-";
  return `Etc/GMT${sign}${Math.abs(offset)}`;
}
