import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

const siteUrl = getAppBaseUrl();

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
