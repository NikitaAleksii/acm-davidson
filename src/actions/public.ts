"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { sendContactEmail } from "@/lib/email";
import { clientIp, rateLimit, verifyTurnstile } from "@/lib/rate-limit";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(200),
  classYear: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  subscribe: z.string().optional(),
});

function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: bots fill every field; humans never see this one.
  if (formData.get("website")) return { ok: true, message: "Thanks! Your message has been sent." };

  const ip = await clientIp();
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many messages from this network. Please try again later." };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")?.toString(), ip))) {
    return { ok: false, message: "CAPTCHA verification failed. Please try again." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    classYear: formData.get("classYear") ?? "",
    message: formData.get("message"),
    subscribe: formData.get("subscribe")?.toString(),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  let emailed = false;
  try {
    emailed = await sendContactEmail({
      name: data.name,
      email: data.email,
      classYear: data.classYear || null,
      body: data.message,
    });
  } catch (err) {
    console.error("[contact] email failed", err);
  }

  await db.message.create({
    data: {
      name: data.name,
      email: data.email,
      classYear: data.classYear || null,
      body: data.message,
      ip,
      emailed,
    },
  });

  if (data.subscribe === "on") {
    await db.subscriber
      .upsert({
        where: { email: data.email.toLowerCase() },
        update: { name: data.name, classYear: data.classYear || null },
        create: { email: data.email.toLowerCase(), name: data.name, classYear: data.classYear || null },
      })
      .catch(() => {});
  }

  return { ok: true, message: "Thanks! Your message has been sent. We'll get back to you soon." };
}

const subscribeSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(200),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  classYear: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true, message: "You're on the list!" };

  const ip = await clientIp();
  if (!rateLimit(`subscribe:${ip}`, 10, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }
  if (!(await verifyTurnstile(formData.get("cf-turnstile-response")?.toString(), ip))) {
    return { ok: false, message: "CAPTCHA verification failed. Please try again." };
  }

  const parsed = subscribeSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    classYear: formData.get("classYear") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }
  const { email, name, classYear } = parsed.data;
  await db.subscriber.upsert({
    where: { email: email.toLowerCase() },
    update: { name: name || undefined, classYear: classYear || undefined },
    create: { email: email.toLowerCase(), name: name || null, classYear: classYear || null },
  });
  return { ok: true, message: "You're on the list! We'll email you about upcoming events." };
}
