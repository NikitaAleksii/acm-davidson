"use client";

import { useEffect, useRef } from "react";
import { changeOwnPassword, createAdmin } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { Alert, Button, Help, Input, Label } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";

function Err({ errors, k }: { errors: Record<string, string>; k: string }) {
  return errors[k] ? <p className="mt-1 text-xs text-red-600">{errors[k]}</p> : null;
}

export function AddAdminForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(createAdmin, null);
  const ref = useRef<HTMLFormElement>(null);
  const errors = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      <div>
        <Label htmlFor="new-name">Name</Label>
        <Input id="new-name" name="name" required autoComplete="off" aria-invalid={!!errors.name} />
        <Err errors={errors} k="name" />
        <Help>Shown in the activity log next to their changes.</Help>
      </div>
      <div>
        <Label htmlFor="new-email">Email</Label>
        <Input id="new-email" name="email" type="email" required autoComplete="off" placeholder="name@davidson.edu" aria-invalid={!!errors.email} />
        <Err errors={errors} k="email" />
      </div>
      <div>
        <Label htmlFor="new-password">Starting password</Label>
        <Input id="new-password" name="password" type="password" required minLength={10} autoComplete="new-password" aria-invalid={!!errors.password} />
        <Err errors={errors} k="password" />
        <Help>At least 10 characters.</Help>
      </div>
      {state && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add admin"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { state, onSubmit, pending } = useFormAction<FormState>(changeOwnPassword, null);
  const ref = useRef<HTMLFormElement>(null);
  const errors = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cur-password">Current password</Label>
        <Input id="cur-password" name="currentPassword" type="password" required autoComplete="current-password" aria-invalid={!!errors.currentPassword} />
        <Err errors={errors} k="currentPassword" />
      </div>
      <div>
        <Label htmlFor="pw">New password</Label>
        <Input id="pw" name="password" type="password" required minLength={10} autoComplete="new-password" aria-invalid={!!errors.password} />
        <Err errors={errors} k="password" />
      </div>
      <div>
        <Label htmlFor="pw2">Confirm new password</Label>
        <Input id="pw2" name="confirm" type="password" required minLength={10} autoComplete="new-password" aria-invalid={!!errors.confirm} />
        <Err errors={errors} k="confirm" />
      </div>
      {state && <Alert kind={state.ok ? "success" : "error"}>{state.message}</Alert>}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
