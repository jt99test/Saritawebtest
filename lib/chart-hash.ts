import type { NatalChartData } from "@/lib/chart";

function parseCoordinateLabel(label: string) {
  const values = label.match(/\d+(?:\.\d+)?/g);
  const directionMatch = label.match(/[NSEW]/i);

  if (!values || values.length === 0) {
    return null;
  }

  if (!directionMatch) {
    return Number(values[0]);
  }

  const [degrees = "0", minutes = "0", seconds = "0"] = values;
  const direction = directionMatch[0]!.toUpperCase();
  const sign = direction === "S" || direction === "W" ? -1 : 1;
  const decimal =
    Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;

  return sign * decimal;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashNatalChart(chart: NatalChartData): Promise<string> {
  const lat = parseCoordinateLabel(chart.event.latitude);
  const lng = parseCoordinateLabel(chart.event.longitude);
  const normalized = [
    chart.event.dateLabel,
    typeof lat === "number" ? lat.toFixed(4) : chart.event.latitude,
    typeof lng === "number" ? lng.toFixed(4) : chart.event.longitude,
    chart.event.timezoneIdentifier,
  ].join("|");
  const encoded = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}
