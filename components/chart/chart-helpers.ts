import type { ChartPoint, HouseCusp } from "@/lib/chart";

export function longitudeToRadians(longitude: number) {
  return (-longitude * Math.PI) / 180;
}

export function polarToCartesian(cx: number, cy: number, radius: number, longitude: number) {
  const radians = longitudeToRadians(longitude);
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

export function describeRingSegment(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startLongitude: number,
  endLongitude: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startLongitude);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endLongitude);
  const startInner = polarToCartesian(cx, cy, innerRadius, startLongitude);
  const endInner = polarToCartesian(cx, cy, innerRadius, endLongitude);
  const largeArcFlag = Math.abs(endLongitude - startLongitude) > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function getHouseMidLongitude(houses: HouseCusp[], index: number) {
  const current = houses[index]!.longitude;
  const next = houses[(index + 1) % houses.length]!.longitude;
  const normalizedNext = next <= current ? next + 360 : next;
  return (current + normalizedNext) / 2;
}

export function getPointDisplayLongitude(point: ChartPoint, points: ChartPoint[]) {
  const sorted = [...points].sort((a, b) => a.longitude - b.longitude);
  const currentIndex = sorted.findIndex((entry) => entry.id === point.id);

  let clusterIndex = 0;
  for (let index = 0; index < currentIndex; index += 1) {
    const previous = sorted[index]!;
    if (Math.abs(previous.longitude - point.longitude) < 8) {
      clusterIndex += 1;
    }
  }

  return {
    longitude: point.longitude,
    radiusOffset: clusterIndex * 18,
  };
}

