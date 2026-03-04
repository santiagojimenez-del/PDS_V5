import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Block all crawlers from authenticated sections
        userAgent: "*",
        disallow: ["/hub/", "/client/", "/admin/", "/api/", "/viewer/"],
        allow: ["/auth/login", "/auth/register", "/auth/forgot-password"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
