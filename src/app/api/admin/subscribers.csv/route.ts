import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

function csvCell(v: string | null | undefined) {
  const s = v ?? "";
  // Guard against spreadsheet formula injection and quote as needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const rows = await db.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const lines = [
    ["email", "name", "class_year", "subscribed_at"].join(","),
    ...rows.map((r) =>
      [csvCell(r.email), csvCell(r.name), csvCell(r.classYear), r.createdAt.toISOString()].join(","),
    ),
  ];
  await logActivity(user, "exported", "subscriber", `exported ${rows.length} subscribers to CSV`);

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="acm-davidson-subscribers-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
