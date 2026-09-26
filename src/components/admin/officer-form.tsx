"use client";

import type { Officer } from "@prisma/client";
import { saveOfficer } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { Alert, Button, Help, Input, Label, Textarea } from "@/components/ui";
import { ImageField } from "./image-field";
import { useFormAction } from "@/components/use-form-action";

export function OfficerForm({ officer, defaultYear }: { officer?: Officer; defaultYear: string }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveOfficer, null);
  const errors = state?.errors ?? {};
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {officer && <input type="hidden" name="id" value={officer.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={officer?.name ?? ""} aria-invalid={!!errors.name} />
          {err("name")}
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            required
            defaultValue={officer?.role ?? ""}
            placeholder="President, Treasurer, Events Chair…"
            aria-invalid={!!errors.role}
          />
          {err("role")}
        </div>
      </div>

      <div>
        <Label htmlFor="academicYear">Academic year</Label>
        <Input
          id="academicYear"
          name="academicYear"
          required
          defaultValue={officer?.academicYear ?? defaultYear}
          pattern="\d{4}-\d{4}"
          placeholder="2025-2026"
          className="max-w-xs"
          aria-invalid={!!errors.academicYear}
        />
        {err("academicYear")}
        <Help>Officers are grouped by year on the Team page. Archive a whole year when new officers take over.</Help>
      </div>

      <div>
        <Label htmlFor="bio">Short bio</Label>
        <Textarea id="bio" name="bio" defaultValue={officer?.bio ?? ""} maxLength={600} className="min-h-24" />
        <Help>A sentence or two: major, class year, what you&apos;re into. Optional.</Help>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
          <Input id="linkedin" name="linkedin" type="url" defaultValue={officer?.linkedin ?? ""} aria-invalid={!!errors.linkedin} />
          {err("linkedin")}
        </div>
        <div>
          <Label htmlFor="github">GitHub URL (optional)</Label>
          <Input id="github" name="github" type="url" defaultValue={officer?.github ?? ""} aria-invalid={!!errors.github} />
          {err("github")}
        </div>
      </div>

      <ImageField name="photo" altName="photoAlt" label="Photo" aspect={4 / 5} defaultUrl={officer?.photo} defaultAlt={officer?.photoAlt} errors={errors} />

      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}

      <div className="flex items-center gap-3 border-t border-default pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : officer ? "Save changes" : "Add officer"}
        </Button>
      </div>
    </form>
  );
}
