import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE } from "./auth-constants";

export { SESSION_COOKIE };
export const CHALLENGE_COOKIE = "acm_login_challenge";
const SESSION_DAYS = 30;
const CHALLENGE_MINUTES = 10;
const CHALLENGE_MAX_ATTEMPTS = 5;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// Hash of a random string, used so that a login attempt for an unknown email
// takes the same time as one for a real account (no user-enumeration timing leak).
const DUMMY_HASH = "$2b$12$9MW0qP1N1VKdvVLHYpKhaOKFVdoO2e7WxG7UbbjeRaEI/Zpw5dAm2";

export async function verifyPassword(password: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return Boolean(hash) && ok;
}

/* ---------- second factor: emailed one-time code ---------- */

/** Creates a pending challenge for a user whose password was verified. Returns the plain code to email. */
export async function createLoginChallenge(userId: string): Promise<string> {
  // 6-digit code from a CSPRNG (never Math.random).
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000);
  // Invalidate any earlier pending challenges for this user.
  await db.loginChallenge.deleteMany({ where: { userId } });
  await db.loginChallenge.create({
    data: { tokenHash: hashToken(token), userId, codeHash: await bcrypt.hash(code, 10), expiresAt },
  });
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    expires: expiresAt,
  });
  return code;
}

export type ChallengeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "missing" | "expired" | "locked" | "wrong" };

/** Checks the submitted code against the pending challenge in the cookie. */
export async function verifyLoginChallenge(code: string): Promise<ChallengeResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (!token) return { ok: false, reason: "missing" };
  const challenge = await db.loginChallenge.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!challenge) return { ok: false, reason: "missing" };

  const discard = async () => {
    await db.loginChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    cookieStore.delete({ name: CHALLENGE_COOKIE, path: "/admin" });
  };

  if (challenge.expiresAt < new Date()) {
    await discard();
    return { ok: false, reason: "expired" };
  }
  if (challenge.attempts >= CHALLENGE_MAX_ATTEMPTS) {
    await discard();
    return { ok: false, reason: "locked" };
  }
  const match = await bcrypt.compare(code.replace(/\D/g, ""), challenge.codeHash);
  if (!match) {
    const updated = await db.loginChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    if (updated.attempts >= CHALLENGE_MAX_ATTEMPTS) {
      await discard();
      return { ok: false, reason: "locked" };
    }
    return { ok: false, reason: "wrong" };
  }
  await discard();
  return { ok: true, userId: challenge.userId };
}

/** Email address the pending code was sent to (masked for display), or null if no valid challenge. */
export async function getPendingChallengeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  const challenge = await db.loginChallenge.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { email: true } } },
  });
  if (!challenge || challenge.expiresAt < new Date()) return null;
  return maskEmail(challenge.user.email);
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const shown = local.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
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
