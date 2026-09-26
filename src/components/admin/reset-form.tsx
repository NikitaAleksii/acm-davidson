"use client";

import Link from "next/link";
import { resetPassword } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { Alert, Button, Help, Input, Label } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";

export function ResetPasswordForm({ token }: { token: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(resetPassword, null);
  const errors = state?.errors ?? {};
  const mustRestart = state && !state.ok && errors.restart;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" autoFocus aria-invalid={!!errors.password} />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        <Help>At least 10 characters.</Help>
      </div>
      <div>
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" aria-invalid={!!errors.confirm} />
        {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
      </div>
      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}
      {mustRestart ? (
        <Link href="/admin/login" className="block w-full rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700">
          Back to sign in
        </Link>
      ) : (
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      )}
    </form>
  );
}
