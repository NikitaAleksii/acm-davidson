import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildIcs } from "@/lib/ics";
import { absoluteUrl, slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event) return new NextResponse("Not found", { status: 404 });

  const ics = buildIcs({
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    url: absoluteUrl(`/events/${event.slug}`),
  });

  return new NextResponse(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slugify(event.title) || "event"}.ics"`,
      "cache-control": "no-store",
    },
  });
}
