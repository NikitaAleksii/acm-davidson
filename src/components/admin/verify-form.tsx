"use client";

import Link from "next/link";
import { verifyCode } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { Alert, Button, Input, Label } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";

export function VerifyForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(verifyCode, null);
  const mustRestart = state && !state.ok && state.errors?.restart;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="code">Sign-in code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          autoFocus
          placeholder="123456"
          className="text-center font-mono text-2xl tracking-[0.4em]"
          aria-invalid={!!state?.errors?.code}
        />
      </div>
      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}
      {mustRestart ? (
        <Link
          href="/admin/login"
          className="block w-full rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to sign in
        </Link>
      ) : (
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Checking…" : "Verify and sign in"}
        </Button>
      )}
    </form>
  );
}
