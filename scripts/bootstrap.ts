/**
 * Runs once at server start (see scripts/start.sh).
 *
 * 1. Creates the first owner account from ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD
 *    if the database has no users yet. Nothing else is seeded in production.
 * 2. Prints loud warnings for configuration that would break sign-in or links.
 *
 * Safe to run every start: it changes nothing once an account exists.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync } from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const warn = (msg: string) => console.warn(`[bootstrap] WARNING: ${msg}`);

async function main() {
  const prod = process.env.NODE_ENV === "production";

  // Make sure the uploads directory exists on the mounted volume.
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  mkdirSync(uploadDir, { recursive: true });

  const users = await db.user.count();
  if (users === 0) {
    const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const name = (process.env.ADMIN_NAME ?? "Owner").trim();
    const password = process.env.ADMIN_PASSWORD ?? "";
    if (!email || !password) {
      warn("no admin accounts exist and ADMIN_EMAIL / ADMIN_PASSWORD are not set. Nobody can sign in.");
    } else if (password.length < 10) {
      warn("ADMIN_PASSWORD is shorter than 10 characters; refusing to create the owner with a weak password.");
    } else {
      await db.user.create({
        data: { email, name, passwordHash: await bcrypt.hash(password, 12), role: "owner" },
      });
      console.log(`[bootstrap] created owner account ${email}. Change this password after first sign-in.`);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (prod && (!siteUrl || siteUrl.includes("localhost"))) {
    warn(`NEXT_PUBLIC_SITE_URL is "${siteUrl || "(unset)"}". Set it to the public https:// address so emails and link previews use the right domain.`);
  }
  if (!process.env.SMTP_HOST) {
    warn(prod
      ? "SMTP_HOST is not set. Admin sign-in codes cannot be emailed, so nobody can sign in. Set SMTP_* in the environment."
      : "SMTP_HOST is not set. Sign-in codes will be printed to this terminal instead of emailed.");
  }
  if (prod && process.env.ADMIN_PASSWORD === "change-me-now") {
    warn("ADMIN_PASSWORD is still the example value. Change it.");
  }
}

main()
  .catch((e) => {
    console.error("[bootstrap] failed", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
