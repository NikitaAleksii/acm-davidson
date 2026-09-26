import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by the hosting platform to know the app is up. Checks the database too. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[health] database check failed", err);
    return NextResponse.json({ ok: false, error: "database" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
