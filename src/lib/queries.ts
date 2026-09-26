import "server-only";
import { db } from "./db";
import { currentAcademicYear } from "./site";

export function getUpcomingEvents(limit?: number) {
  return db.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
}

export function getPastEvents(limit?: number) {
  return db.event.findMany({
    where: { startsAt: { lt: new Date() } },
    orderBy: { startsAt: "desc" },
    take: limit,
  });
}

export function getLatestPosts(limit = 3) {
  return db.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function searchPosts(q: string | undefined, tag: string | undefined) {
  const query = q?.trim();
  return db.post.findMany({
    where: {
      published: true,
      ...(tag ? { tags: { contains: tag } } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { content: { contains: query } },
              { excerpt: { contains: query } },
              { tags: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getCurrentOfficers() {
  const year = currentAcademicYear();
  const officers = await db.officer.findMany({
    where: { archived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  // Prefer the current academic year's roster; fall back to the latest year that has officers.
  const years = Array.from(new Set(officers.map((o) => o.academicYear))).sort().reverse();
  const activeYear = years.includes(year) ? year : years[0];
  return { year: activeYear, officers: officers.filter((o) => o.academicYear === activeYear) };
}

export async function getArchivedOfficersByYear() {
  const officers = await db.officer.findMany({
    where: { archived: true },
    orderBy: [{ academicYear: "desc" }, { sortOrder: "asc" }],
  });
  const byYear = new Map<string, typeof officers>();
  for (const o of officers) {
    byYear.set(o.academicYear, [...(byYear.get(o.academicYear) ?? []), o]);
  }
  return Array.from(byYear.entries());
}
