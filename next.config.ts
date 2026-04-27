import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ephemeris", "geo-tz", "swisseph-wasm"],
};

export default nextConfig;
