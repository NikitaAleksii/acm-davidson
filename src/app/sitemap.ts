import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, events] = await Promise.all([
    db.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    db.event.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  const staticPages = ["", "/about", "/events", "/posts", "/team", "/get-involved", "/contact"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticPages,
    ...posts.map((p) => ({ url: `${site.url}/posts/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...events.map((e) => ({ url: `${site.url}/events/${e.slug}`, lastModified: e.updatedAt, priority: 0.6 })),
  ];
}
