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
