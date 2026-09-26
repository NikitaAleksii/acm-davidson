import { PrismaClient } from "@prisma/client";

// Fall back to the local SQLite file if .env is missing (e.g. a fresh unzip).
// `prisma migrate` still needs DATABASE_URL, so copy .env.example to .env.
process.env.DATABASE_URL ??= "file:./dev.db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
