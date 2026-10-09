import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/home", "/account", "/onboarding", "/auth/", "/sign-in", "/admin"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
