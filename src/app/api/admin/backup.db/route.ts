import { NextResponse } from "next/server";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getCurrentUser, isOwner } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/**
 * Owner-only download of a consistent snapshot of the SQLite database.
 * Uses SQLite's VACUUM INTO so the copy is safe even while the site is in use.
 * Uploaded images are not included; back up the uploads folder separately.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!isOwner(user)) return new NextResponse("Owners only", { status: 403 });
  if (!(process.env.DATABASE_URL ?? "file:").startsWith("file:")) {
    return new NextResponse("Backup download is only available for SQLite databases", { status: 501 });
  }

  const tmp = path.join(tmpdir(), `acm-backup-${randomBytes(6).toString("hex")}.db`);
  try {
    await db.$executeRawUnsafe(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
    const data = await readFile(tmp);
    await logActivity(user, "exported", "admin", "downloaded a database backup");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": "application/vnd.sqlite3",
        "content-disposition": `attachment; filename="acm-davidson-${stamp}.db"`,
        "cache-control": "no-store",
      },
    });
  } finally {
    await unlink(tmp).catch(() => {});
  }
}
