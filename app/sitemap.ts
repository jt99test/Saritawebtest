import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritawebtest.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/form", "/luna-del-mes", "/yoga-astral", "/lecturas"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
