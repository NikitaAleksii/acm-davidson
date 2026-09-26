/**
 * Create or reset an admin account.
 *
 *   npm run create-admin -- officer@davidson.edu "Full Name" "a-strong-password" [owner|admin]
 *
 * Falls back to ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD env vars. The role is
 * only applied when given; the very first account is always made an owner.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const [, , argEmail, argName, argPassword, argRole] = process.argv;
  if (argRole && argRole !== "owner" && argRole !== "admin") {
    console.error('Role must be "owner" or "admin".');
    process.exit(1);
  }
  const email = (argEmail ?? process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const name = argName ?? process.env.ADMIN_NAME ?? "ACM Admin";
  const password = argPassword ?? process.env.ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    console.error("Usage: npm run create-admin -- <email> <name> <password>");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isFirst = (await db.user.count()) === 0;
  const role = argRole ?? (isFirst ? "owner" : undefined);
  const user = await db.user.upsert({
    where: { email },
    update: { name, passwordHash, ...(role ? { role } : {}) },
    create: { email, name, passwordHash, role: role ?? "admin" },
  });
  // Resetting a password signs that user out everywhere.
  await db.session.deleteMany({ where: { userId: user.id } });
  console.log(`${user.role === "owner" ? "Owner" : "Admin"} ready: ${user.name} <${user.email}>`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
