import "server-only";
import nodemailer from "nodemailer";
import { site } from "./site";

/*
 * Outgoing email. Two transports, picked automatically:
 *
 *   1. Brevo HTTP API (BREVO_API_KEY set). Uses HTTPS on port 443, so it works on
 *      hosts that block SMTP ports (Railway Free/Hobby, Render free, many clouds).
 *   2. SMTP (SMTP_HOST set). Any provider: Brevo SMTP, Gmail, Office 365, …
 *
 * Neither set: development prints codes/links to the log; production fails closed.
 */

type Mail = { to: string; subject: string; text: string; replyTo?: { email: string; name?: string } };

export function emailConfigured() {
  return Boolean(process.env.BREVO_API_KEY || process.env.SMTP_HOST);
}

/** Parses `Name <addr@x>` or `addr@x` into parts. */
function parseFrom(raw: string | undefined) {
  const value = (raw ?? `ACM Davidson Website <${site.email}>`).trim();
  const m = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { name: undefined, email: value };
}

async function sendViaBrevoApi(mail: Mail) {
  const sender = parseFrom(process.env.SMTP_FROM ?? process.env.EMAIL_FROM);
  // BREVO_API_URL exists only so tests can point at a local fake.
  const res = await fetch(process.env.BREVO_API_URL ?? "https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: mail.to }],
      subject: mail.subject,
      textContent: mail.text,
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API ${res.status}: ${body.slice(0, 300)}`);
  }
}

async function sendViaSmtp(mail: Mail) {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    // Fail fast instead of making the user wait two minutes on a blocked port.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  await t.sendMail({
    from: process.env.SMTP_FROM ?? `ACM Davidson Website <${site.email}>`,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    ...(mail.replyTo ? { replyTo: mail.replyTo.name ? `${mail.replyTo.name} <${mail.replyTo.email}>` : mail.replyTo.email } : {}),
  });
}

/** Sends one email. Returns false (without throwing) only when no transport is configured. */
async function deliver(mail: Mail): Promise<boolean> {
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevoApi(mail);
    return true;
  }
  if (process.env.SMTP_HOST) {
    await sendViaSmtp(mail);
    return true;
  }
  return false;
}

/**
 * Emails a one-time sign-in code to the admin's own address.
 * Returns true if sent. Without email configured, development prints the code
 * to the server log; production fails closed.
 */
export async function sendLoginCode(to: string, code: string): Promise<boolean> {
  const subject = `${code} is your ${site.name} admin sign-in code`;
  const text = [
    `Your one-time sign-in code for the ${site.name} admin dashboard is:`,
    "",
    `    ${code}`,
    "",
    "It expires in 10 minutes. If you didn't try to sign in, ignore this email",
    "and consider changing the admin password.",
  ].join("\n");

  if (!emailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] no email transport configured; cannot send sign-in code.");
      return false;
    }
    console.log(`[email] Email not configured. Sign-in code for ${to}: ${code}`);
    return true;
  }
  return deliver({ to, subject, text });
}

/** Lets a newly added admin know an account exists for them (no password is included). */
export async function sendAdminWelcome(to: string, name: string, addedBy: string): Promise<boolean> {
  const subject = `You now have admin access to the ${site.name} website`;
  const text = [
    `Hi ${name},`,
    "",
    `${addedBy} added you as an admin on the ${site.name} website.`,
    `Sign in at ${site.url}/admin/login with this email address and the password they gave you.`,
    "Each time you sign in, a one-time code will be emailed to this address.",
    "",
    "Change your password from the Admins page after your first sign-in.",
  ].join("\n");
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== "production") console.log(`[email] (not configured) welcome email for ${to} not sent`);
    return false;
  }
  return deliver({ to, subject, text });
}

/** Emails a password-reset link requested by an owner. */
export async function sendPasswordResetEmail(to: string, name: string, link: string, requestedBy: string): Promise<boolean> {
  const subject = `Set a new password for the ${site.name} admin dashboard`;
  const text = [
    `Hi ${name},`,
    "",
    `${requestedBy} asked you to set a new password for the ${site.name} website admin.`,
    "Open this link within the next hour to choose one:",
    "",
    `    ${link}`,
    "",
    "If you weren't expecting this, you can ignore it. Your current password still works",
    "until you use the link.",
  ].join("\n");
  if (!emailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] no email transport configured; cannot send password reset.");
      return false;
    }
    console.log(`[email] Email not configured. Password reset link for ${to}: ${link}`);
    return true;
  }
  return deliver({ to, subject, text });
}

export type ContactMessage = {
  name: string;
  email: string;
  classYear?: string | null;
  body: string;
};

/**
 * Emails a contact-form message to the chapter address.
 * Returns true if the email was actually sent, false if email is not configured.
 */
export async function sendContactEmail(msg: ContactMessage): Promise<boolean> {
  const subject = `[ACM Davidson site] Message from ${msg.name}`;
  const text = [
    `Name: ${msg.name}`,
    `Email: ${msg.email}`,
    `Class year: ${msg.classYear || "n/a"}`,
    "",
    msg.body,
    "",
    `— Sent from the contact form at ${site.url}`,
  ].join("\n");

  if (!emailConfigured()) {
    console.log(`[email] Email not configured. Would send to ${site.email}:\n${subject}\n${text}`);
    return false;
  }
  return deliver({ to: site.email, subject, text, replyTo: { email: msg.email, name: msg.name } });
}
