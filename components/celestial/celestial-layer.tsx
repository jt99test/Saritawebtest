"use client";

import dynamic from "next/dynamic";

const CelestialCanvas = dynamic(
  () => import("@/components/celestial/celestial-canvas"),
  {
    ssr: false,
  },
);

export function CelestialLayer() {
  return <CelestialCanvas />;
}
