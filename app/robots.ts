import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saritaastrology.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/cuenta",
          "/lecturas",
          "/resultado",
          "/loading",
          "/debug/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
