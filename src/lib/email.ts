import "server-only";
import nodemailer from "nodemailer";
import { site } from "./site";

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

/**
 * Emails a one-time sign-in code to the admin's own address.
 * Returns true if sent. Without SMTP in development the code is printed to the
 * server log instead; in production the sign-in fails closed.
 */
export async function sendLoginCode(to: string, code: string): Promise<boolean> {
  const t = transporter();
  const recipient = to;
  const subject = `${code} is your ${site.name} admin sign-in code`;
  const text = [
    `Your one-time sign-in code for the ${site.name} admin dashboard is:`,
    "",
    `    ${code}`,
    "",
    "It expires in 10 minutes. If you didn't try to sign in, ignore this email",
    "and consider changing the admin password.",
  ].join("\n");

  if (!t) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] SMTP not configured; cannot send sign-in code.");
      return false;
    }
    console.log(`[email] SMTP not configured. Sign-in code for ${recipient}: ${code}`);
    return true;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM ?? `ACM Davidson Website <${site.email}>`,
    to: recipient,
    subject,
    text,
  });
  return true;
}

/** Lets a newly added admin know an account exists for them (no password is included). */
export async function sendAdminWelcome(to: string, name: string, addedBy: string): Promise<boolean> {
  const t = transporter();
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
  if (!t) {
    if (process.env.NODE_ENV !== "production") console.log(`[email] (no SMTP) welcome email for ${to} not sent`);
    return false;
  }
  await t.sendMail({ from: process.env.SMTP_FROM ?? `ACM Davidson Website <${site.email}>`, to, subject, text });
  return true;
}

export type ContactMessage = {
  name: string;
  email: string;
  classYear?: string | null;
  body: string;
};

/**
 * Emails a contact-form message to the chapter address.
 * Returns true if the email was actually sent, false if SMTP is not configured.
 */
export async function sendContactEmail(msg: ContactMessage): Promise<boolean> {
  const t = transporter();
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

  if (!t) {
    console.log(`[email] SMTP not configured. Would send to ${site.email}:\n${subject}\n${text}`);
    return false;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM ?? `ACM Davidson Website <${site.email}>`,
    to: site.email,
    replyTo: `${msg.name} <${msg.email}>`,
    subject,
    text,
  });
  return true;
}
