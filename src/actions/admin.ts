"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  consumePasswordReset,
  createLoginChallenge,
  createPasswordReset,
  createSession,
  destroyAllSessions,
  destroyCurrentSession,
  getCurrentUser,
  hashPassword,
  lookupPasswordReset,
  requireAdmin,
  requireOwner,
  verifyLoginChallenge,
  verifyPassword,
} from "@/lib/auth";
import { sendAdminWelcome, sendLoginCode, sendPasswordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/utils";
import { logActivity } from "@/lib/activity";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fromDateTimeLocal, joinTags, slugify } from "@/lib/utils";
import type { FormState } from "./public";

/* ---------- helpers ---------- */

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function str(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function revalidatePublic() {
  for (const p of ["/", "/events", "/posts", "/team", "/get-involved"]) revalidatePath(p);
}

async function uniqueSlug(table: "post" | "event", base: string, excludeId?: string) {
  const root = slugify(base) || "untitled";
  let slug = root;
  for (let i = 2; i < 1000; i++) {
    const existing =
      table === "post"
        ? await db.post.findUnique({ where: { slug }, select: { id: true } })
        : await db.event.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), "Must be an http(s) URL or a site path")
  .optional()
  .or(z.literal(""));

/* ---------- auth ---------- */

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { ok: false, message: "Too many login attempts. Try again in 15 minutes." };
  }
  const email = str(formData, "email").trim().toLowerCase();
  const password = str(formData, "password");
  const next = str(formData, "next");
  const user = await db.user.findUnique({ where: { email } });
  // verifyPassword runs bcrypt even when the user is unknown (constant-time-ish).
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) {
    return { ok: false, message: "Incorrect email or password." };
  }

  // Password OK. Second step: email a one-time code and ask for it.
  const code = await createLoginChallenge(user.id);
  const sent = await sendLoginCode(user.email, code).catch((err) => {
    console.error("[login] failed to send code", err);
    return false;
  });
  if (!sent) {
    return { ok: false, message: "We couldn't send the sign-in code email. Ask the webmaster to check SMTP settings." };
  }
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  redirect(`/admin/login/verify?next=${encodeURIComponent(safeNext)}`);
}

export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`verify:${ip}`, 20, 15 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts. Try again in 15 minutes." };
  }
  const code = str(formData, "code");
  const next = str(formData, "next");
  const result = await verifyLoginChallenge(code);
  if (!result.ok) {
    const messages = {
      missing: "Your sign-in attempt expired. Please start again.",
      expired: "That code has expired. Please sign in again to get a new one.",
      locked: "Too many wrong codes. Please sign in again to get a new one.",
      wrong: "That code isn't right. Check the email and try again.",
    } as const;
    return { ok: false, message: messages[result.reason], errors: result.reason === "wrong" ? { code: "Incorrect code" } : { restart: "1" } };
  }
  const user = await db.user.findUnique({ where: { id: result.userId } });
  if (!user) return { ok: false, message: "Account not found." };
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logActivity({ ...user, sessionId: "" }, "login", "session", `${user.name} signed in`);
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await logActivity(user, "logout", "session", `${user.name} signed out`);
  await destroyCurrentSession();
  redirect("/admin/login");
}

export async function logoutAll() {
  const user = await requireAdmin();
  await logActivity(user, "logout_all", "session", `${user.name} signed out of all sessions`);
  await destroyAllSessions(user.id);
  redirect("/admin/login?all=1");
}

/* ---------- admin accounts ---------- */

const passwordRule = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(200)
  .refine((p) => !/^(.)\1+$/.test(p), "Choose a less predictable password");

const adminSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(200),
  password: passwordRule,
});

export async function createAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const parsed = adminSchema.safeParse({
    name: str(formData, "name"),
    email: str(formData, "email").toLowerCase(),
    password: str(formData, "password"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const { name, email, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) {
    return { ok: false, message: "An admin with that email already exists.", errors: { email: "Already in use" } };
  }
  const user = await db.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await logActivity(actor, "created", "admin", `added admin ${user.name} <${user.email}>`, user.id);
  await sendAdminWelcome(user.email, user.name, actor.name).catch((err) => {
    console.error("[admin] welcome email failed", err);
    return false;
  });
  revalidatePath("/admin/admins");
  return { ok: true, message: `${user.name} can now sign in with ${user.email}. Share the password with them privately.` };
}

export async function deleteAdmin(formData: FormData) {
  const actor = await requireOwner();
  const id = str(formData, "id");
  if (id === actor.id) return; // can't remove yourself
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return;
  if (target.role === "owner") {
    const owners = await db.user.count({ where: { role: "owner" } });
    if (owners <= 1) return; // keep at least one owner
  }
  const user = await db.user.delete({ where: { id } });
  await logActivity(actor, "deleted", "admin", `removed admin ${user.name} <${user.email}>`, user.id);
  revalidatePath("/admin/admins");
}

/** Owner asks an admin to set a new password; they get a one-hour link by email. */
export async function requestPasswordReset(formData: FormData) {
  const actor = await requireOwner();
  const id = str(formData, "id");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return;
  const token = await createPasswordReset(user.id);
  const link = absoluteUrl(`/admin/reset?token=${token}`);
  const sent = await sendPasswordResetEmail(user.email, user.name, link, actor.name).catch((err) => {
    console.error("[admin] reset email failed", err);
    return false;
  });
  await logActivity(
    actor,
    "updated",
    "admin",
    sent ? `sent a password reset link to ${user.name} <${user.email}>` : `tried to send a password reset to ${user.email} but email failed`,
    user.id,
  );
  revalidatePath("/admin/admins");
  redirect(`/admin/admins?reset=${sent ? "sent" : "failed"}&to=${encodeURIComponent(user.email)}`);
}

/** Public: the admin follows the emailed link and sets a new password. */
export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts. Try again in 15 minutes." };
  }
  const token = str(formData, "token");
  const reset = await lookupPasswordReset(token);
  if (!reset) return { ok: false, message: "This link is invalid or has expired. Ask an owner to send a new one.", errors: { restart: "1" } };
  const parsed = z
    .object({ password: passwordRule, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse({ password: str(formData, "password"), confirm: str(formData, "confirm") });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  await db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  await db.session.deleteMany({ where: { userId: reset.userId } });
  await consumePasswordReset(reset.id);
  await logActivity(
    { id: reset.user.id, email: reset.user.email, name: reset.user.name, role: "admin", sessionId: "" },
    "updated",
    "admin",
    `${reset.user.name} set a new password via reset link`,
    reset.user.id,
  );
  redirect("/admin/login?reset=1");
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  const current = str(formData, "currentPassword");
  const parsed = z
    .object({ password: passwordRule, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] })
    .safeParse({ password: str(formData, "password"), confirm: str(formData, "confirm") });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const user = await db.user.findUnique({ where: { id: actor.id } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { ok: false, message: "Your current password is incorrect.", errors: { currentPassword: "Incorrect" } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  // Sign out every other device; keep this one.
  await db.session.deleteMany({ where: { userId: user.id, NOT: { id: actor.sessionId } } });
  await logActivity(actor, "updated", "admin", `${actor.name} changed their password`, user.id);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

/* ---------- posts ---------- */

const postSchema = z
  .object({
    title: z.string().trim().min(2, "Title is required").max(200),
    slug: z.string().trim().max(100).optional().or(z.literal("")),
    excerpt: z.string().trim().max(300).optional().or(z.literal("")),
    content: z.string().trim().min(1, "Content is required").max(100_000),
    tags: z.array(z.string().trim().max(40)).max(10),
    coverImage: optionalUrl,
    coverAlt: z.string().trim().max(300).optional().or(z.literal("")),
    authorName: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((d) => !d.coverImage || (d.coverAlt && d.coverAlt.length > 0), {
    message: "Alt text is required when a cover image is set",
    path: ["coverAlt"],
  });

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const id = str(formData, "id") || null;
  const intent = str(formData, "intent") as "draft" | "publish" | "unpublish";

  const parsed = postSchema.safeParse({
    title: str(formData, "title"),
    slug: str(formData, "slug"),
    excerpt: str(formData, "excerpt"),
    content: str(formData, "content"),
    tags: formData
      .getAll("tags")
      .map(String)
      .concat(
        str(formData, "customTags")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    coverImage: str(formData, "coverImage"),
    coverAlt: str(formData, "coverAlt"),
    authorName: str(formData, "authorName"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const slug = await uniqueSlug("post", d.slug || d.title, id ?? undefined);
  const existing = id ? await db.post.findUnique({ where: { id } }) : null;
  const published = intent === "publish" ? true : intent === "unpublish" ? false : (existing?.published ?? false);

  const data = {
    title: d.title,
    slug,
    excerpt: d.excerpt || null,
    content: d.content,
    tags: joinTags(d.tags),
    coverImage: d.coverImage || null,
    coverAlt: d.coverImage ? d.coverAlt || null : null,
    authorName: d.authorName || user.name,
    published,
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
  };

  const post = existing
    ? await db.post.update({ where: { id: existing.id }, data })
    : await db.post.create({ data });

  const action =
    intent === "publish" && !existing?.published
      ? "published"
      : intent === "unpublish"
        ? "unpublished"
        : existing
          ? "updated"
          : "created";
  await logActivity(user, action, "post", `${action} post “${post.title}”`, post.id);
  revalidatePublic();
  revalidatePath(`/posts/${post.slug}`);
  redirect(`/admin/posts/${post.id}?saved=${action}`);
}

export async function deletePost(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const post = await db.post.delete({ where: { id } });
  await logActivity(user, "deleted", "post", `deleted post “${post.title}”`, post.id);
  revalidatePublic();
  redirect("/admin/posts?deleted=1");
}

/* ---------- events ---------- */

const eventSchema = z
  .object({
    title: z.string().trim().min(2, "Title is required").max(200),
    slug: z.string().trim().max(100).optional().or(z.literal("")),
    description: z.string().trim().min(1, "Description is required").max(50_000),
    startsAt: z.string().min(1, "Start date/time is required"),
    endsAt: z.string().optional().or(z.literal("")),
    location: z.string().trim().min(1, "Location is required").max(200),
    image: optionalUrl,
    imageAlt: z.string().trim().max(300).optional().or(z.literal("")),
    rsvpUrl: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => v === "" || /^https?:\/\//.test(v), "Must be an http(s) URL")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => !d.image || (d.imageAlt && d.imageAlt.length > 0), {
    message: "Alt text is required when an image is set",
    path: ["imageAlt"],
  });

export async function saveEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const id = str(formData, "id") || null;
  const parsed = eventSchema.safeParse({
    title: str(formData, "title"),
    slug: str(formData, "slug"),
    description: str(formData, "description"),
    startsAt: str(formData, "startsAt"),
    endsAt: str(formData, "endsAt"),
    location: str(formData, "location"),
    image: str(formData, "image"),
    imageAlt: str(formData, "imageAlt"),
    rsvpUrl: str(formData, "rsvpUrl"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const startsAt = fromDateTimeLocal(d.startsAt);
  const endsAt = d.endsAt ? fromDateTimeLocal(d.endsAt) : null;
  if (!startsAt) return { ok: false, message: "Invalid start date.", errors: { startsAt: "Invalid date" } };
  if (endsAt && endsAt <= startsAt) {
    return { ok: false, message: "End time must be after the start time.", errors: { endsAt: "Must be after start" } };
  }
  const slug = await uniqueSlug("event", d.slug || d.title, id ?? undefined);
  const data = {
    title: d.title,
    slug,
    description: d.description,
    startsAt,
    endsAt,
    location: d.location,
    image: d.image || null,
    imageAlt: d.image ? d.imageAlt || null : null,
    rsvpUrl: d.rsvpUrl || null,
    isMeeting: str(formData, "isMeeting") === "on",
  };
  const event = id
    ? await db.event.update({ where: { id }, data })
    : await db.event.create({ data });
  await logActivity(user, id ? "updated" : "created", "event", `${id ? "updated" : "created"} event “${event.title}”`, event.id);
  revalidatePublic();
  revalidatePath(`/events/${event.slug}`);
  redirect(`/admin/events/${event.id}?saved=1`);
}

export async function deleteEvent(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const event = await db.event.delete({ where: { id } });
  await logActivity(user, "deleted", "event", `deleted event “${event.title}”`, event.id);
  revalidatePublic();
  redirect("/admin/events?deleted=1");
}

/* ---------- officers ---------- */

const officerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(100),
    role: z.string().trim().min(2, "Role is required").max(100),
    bio: z.string().trim().max(600).optional().or(z.literal("")),
    photo: optionalUrl,
    photoAlt: z.string().trim().max(300).optional().or(z.literal("")),
    linkedin: z
      .string()
      .trim()
      .max(300)
      .refine((v) => v === "" || /^https?:\/\//.test(v), "Must be an http(s) URL")
      .optional()
      .or(z.literal("")),
    github: z
      .string()
      .trim()
      .max(300)
      .refine((v) => v === "" || /^https?:\/\//.test(v), "Must be an http(s) URL")
      .optional()
      .or(z.literal("")),
    academicYear: z.string().trim().regex(/^\d{4}-\d{4}$/, "Use the format 2025-2026"),
  })
  .refine((d) => !d.photo || (d.photoAlt && d.photoAlt.length > 0), {
    message: "Alt text is required when a photo is set",
    path: ["photoAlt"],
  });

export async function saveOfficer(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const id = str(formData, "id") || null;
  const parsed = officerSchema.safeParse({
    name: str(formData, "name"),
    role: str(formData, "role"),
    bio: str(formData, "bio"),
    photo: str(formData, "photo"),
    photoAlt: str(formData, "photoAlt"),
    linkedin: str(formData, "linkedin"),
    github: str(formData, "github"),
    academicYear: str(formData, "academicYear"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const data = {
    name: d.name,
    role: d.role,
    bio: d.bio || null,
    photo: d.photo || null,
    photoAlt: d.photo ? d.photoAlt || null : null,
    linkedin: d.linkedin || null,
    github: d.github || null,
    academicYear: d.academicYear,
  };
  let officer;
  if (id) {
    officer = await db.officer.update({ where: { id }, data });
  } else {
    const last = await db.officer.findFirst({
      where: { academicYear: d.academicYear, archived: false },
      orderBy: { sortOrder: "desc" },
    });
    officer = await db.officer.create({ data: { ...data, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  }
  await logActivity(user, id ? "updated" : "created", "officer", `${id ? "updated" : "added"} officer ${officer.name} (${officer.role})`, officer.id);
  revalidatePath("/team");
  redirect(`/admin/team?saved=1`);
}

export async function deleteOfficer(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const officer = await db.officer.delete({ where: { id } });
  await logActivity(user, "deleted", "officer", `deleted officer ${officer.name}`, officer.id);
  revalidatePath("/team");
  redirect("/admin/team?deleted=1");
}

export async function moveOfficer(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const direction = str(formData, "direction") === "up" ? -1 : 1;
  const officer = await db.officer.findUnique({ where: { id } });
  if (!officer) return;
  const siblings = await db.officer.findMany({
    where: { academicYear: officer.academicYear, archived: officer.archived },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const idx = siblings.findIndex((s) => s.id === id);
  const swapWith = siblings[idx + direction];
  if (!swapWith) return;
  // Normalize sort orders then swap the two.
  const reordered = siblings.map((s, i) => ({ id: s.id, sortOrder: i }));
  const a = reordered[idx];
  const b = reordered[idx + direction];
  [a.sortOrder, b.sortOrder] = [b.sortOrder, a.sortOrder];
  await db.$transaction(reordered.map((r) => db.officer.update({ where: { id: r.id }, data: { sortOrder: r.sortOrder } })));
  await logActivity(user, "reordered", "officer", `moved ${officer.name} ${direction < 0 ? "up" : "down"}`, officer.id);
  revalidatePath("/team");
  revalidatePath("/admin/team");
}

export async function setOfficerArchived(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const archived = str(formData, "archived") === "true";
  const officer = await db.officer.update({ where: { id }, data: { archived } });
  await logActivity(user, archived ? "archived" : "restored", "officer", `${archived ? "archived" : "restored"} officer ${officer.name} (${officer.academicYear})`, officer.id);
  revalidatePath("/team");
  revalidatePath("/admin/team");
}

export async function archiveAcademicYear(formData: FormData) {
  const user = await requireAdmin();
  const academicYear = str(formData, "academicYear");
  const result = await db.officer.updateMany({ where: { academicYear, archived: false }, data: { archived: true } });
  await logActivity(user, "archived", "officer", `archived ${result.count} officers from ${academicYear}`);
  revalidatePath("/team");
  revalidatePath("/admin/team");
}

/* ---------- messages & subscribers ---------- */

export async function setMessageRead(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const read = str(formData, "read") === "true";
  await db.message.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const m = await db.message.delete({ where: { id } });
  await logActivity(user, "deleted", "message", `deleted message from ${m.name} <${m.email}>`, m.id);
  revalidatePath("/admin/messages");
}

export async function deleteSubscriber(formData: FormData) {
  const user = await requireAdmin();
  const id = str(formData, "id");
  const s = await db.subscriber.delete({ where: { id } });
  await logActivity(user, "deleted", "subscriber", `removed subscriber ${s.email}`, s.id);
  revalidatePath("/admin/subscribers");
}
