import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, UPLOAD_TYPES, uploadDir } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
  }
  const ext = UPLOAD_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF, or AVIF images are allowed" }, { status: 415 });
  }

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
