import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE } from "./auth-constants";

export { SESSION_COOKIE };
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Creates a DB session and sets the cookie. Returns the user. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const h = await headers();
  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; email: string; name: string; sessionId: string };

/** Returns the current admin user or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return { ...session.user, sessionId: session.id };
});

/** Use at the top of admin pages and server actions. Redirects to login if signed out. */
export async function requireAdmin(nextPath?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const q = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/admin/login${q}`);
  }
  return user;
}

export async function destroyCurrentSession() {
  const user = await getCurrentUser();
  if (user) await db.session.delete({ where: { id: user.sessionId } }).catch(() => {});
  await clearSessionCookie();
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
  await clearSessionCookie();
}
