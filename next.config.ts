import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ephemeris", "geo-tz", "swisseph"],
};

export default nextConfig;
