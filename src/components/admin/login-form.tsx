"use client";

import { login } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { Alert, Button, Input, Label } from "@/components/ui";
import { useFormAction } from "@/components/use-form-action";

export function LoginForm({ next }: { next?: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(login, null);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" autoFocus />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
