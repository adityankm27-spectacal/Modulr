import type { MetadataRoute } from "next";
import { getPublishedSubjects } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";

// Built per request so newly published subjects appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/subjects", "/pricing", "/terms", "/privacy", "/refunds", "/contact"].map(
    (path) => ({ url: `${siteUrl}${path}` }),
  );
  const subjects = await getPublishedSubjects();
  return [
    ...pages,
    ...subjects.map((subject) => ({
      url: `${siteUrl}/subjects/${subject.id}`,
      lastModified: subject.updated_at,
    })),
  ];
}
