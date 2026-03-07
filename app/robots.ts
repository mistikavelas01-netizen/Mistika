import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/app-url";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/orders", "/cart"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
