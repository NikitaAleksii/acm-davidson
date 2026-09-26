"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { submitContact, subscribe, type FormState } from "@/actions/public";
import { CLASS_YEARS } from "@/lib/site";
import { Alert, Button, Help, Input, Label, Select, Textarea } from "./ui";
import { useFormAction } from "./use-form-action";

const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function Turnstile() {
  if (!TURNSTILE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} data-theme="auto" />
    </>
  );
}

/** Visually hidden honeypot field. Bots fill it; humans never see it. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
      <label htmlFor="website">Leave this field empty</label>
      <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function ContactForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(submitContact, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-err" : undefined}
          />
          {errors.name && (
            <p id="name-err" className="mt-1 text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-err" : undefined}
          />
          {errors.email && (
            <p id="email-err" className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="classYear">Class year</Label>
        <Select id="classYear" name="classYear" defaultValue="">
          <option value="">Select one (optional)</option>
          {CLASS_YEARS.map((y) => (
            <option key={y} value={y}>
              Class of {y}
            </option>
          ))}
          <option value="Faculty/Staff">Faculty / Staff</option>
          <option value="Alum">Alum</option>
          <option value="Other">Other</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-err" : undefined}
        />
        {errors.message && (
          <p id="message-err" className="mt-1 text-xs text-red-600">
            {errors.message}
          </p>
        )}
      </div>
      <div className="flex items-start gap-2">
        <input id="subscribe" name="subscribe" type="checkbox" className="mt-1 h-4 w-4 accent-brand-600" />
        <Label htmlFor="subscribe" className="mb-0 font-normal">
          Also add me to the ACM Davidson mailing list
        </Label>
      </div>
      <Turnstile />
      {state && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
      <Help>We reply from the chapter email address. No spam, ever.</Help>
    </form>
  );
}

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(subscribe, null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative space-y-4" noValidate>
      <Honeypot />
      {!compact && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sub-name">Name</Label>
            <Input id="sub-name" name="name" autoComplete="name" />
          </div>
          <div>
            <Label htmlFor="sub-year">Class year</Label>
            <Select id="sub-year" name="classYear" defaultValue="">
              <option value="">Optional</option>
              {CLASS_YEARS.map((y) => (
                <option key={y} value={y}>
                  Class of {y}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="sub-email">Email</Label>
        <div className="flex gap-2">
          <Input
            id="sub-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@davidson.edu"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "sub-email-err" : undefined}
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? "Joining…" : "Subscribe"}
          </Button>
        </div>
        {errors.email && (
          <p id="sub-email-err" className="mt-1 text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>
      <Turnstile />
      {state && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
    </form>
  );
}
