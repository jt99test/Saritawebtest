import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/form",
    "/luna-del-mes",
    "/yoga-astral",
    "/yoga-astral/kriyas/lavado-intestinal",
    "/astrocartografia",
    "/precios",
    "/ayuda",
    "/privacidad",
    "/terminos",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
