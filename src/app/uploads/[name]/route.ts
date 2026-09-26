import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, uploadDir } from "@/lib/uploads";

export const runtime = "nodejs";

/** Serves admin-uploaded images from UPLOAD_DIR with long-lived caching. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // Only allow the exact filename shape the upload route produces.
  if (!/^[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|webp|gif|avif)$/.test(name)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = name.split(".").pop()!;
  try {
    const data = await readFile(path.join(uploadDir(), name));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
