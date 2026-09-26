"use client";

import Link from "next/link";
import type { Event } from "@prisma/client";
import { saveEvent } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { toDateTimeLocal } from "@/lib/utils";
import { Alert, Button, Help, Input, Label, Textarea } from "@/components/ui";
import { ImageField } from "./image-field";
import { useFormAction } from "@/components/use-form-action";

export function EventForm({ event }: { event?: Event }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveEvent, null);
  const errors = state?.errors ?? {};
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={event?.title ?? ""} aria-invalid={!!errors.title} />
        {err("title")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startsAt">Starts</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={toDateTimeLocal(event?.startsAt)}
            aria-invalid={!!errors.startsAt}
          />
          {err("startsAt")}
          <Help>Eastern time.</Help>
        </div>
        <div>
          <Label htmlFor="endsAt">Ends (optional)</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={toDateTimeLocal(event?.endsAt)}
            aria-invalid={!!errors.endsAt}
          />
          {err("endsAt")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            required
            defaultValue={event?.location ?? ""}
            placeholder="Chambers 1027"
            aria-invalid={!!errors.location}
          />
          {err("location")}
        </div>
        <div>
          <Label htmlFor="rsvpUrl">RSVP / registration link (optional)</Label>
          <Input
            id="rsvpUrl"
            name="rsvpUrl"
            type="url"
            defaultValue={event?.rsvpUrl ?? ""}
            placeholder="https://forms.gle/…"
            aria-invalid={!!errors.rsvpUrl}
          />
          {err("rsvpUrl")}
        </div>
      </div>

      <div>
        <Label htmlFor="slug">URL slug</Label>
        <Input id="slug" name="slug" defaultValue={event?.slug ?? ""} placeholder="auto-generated from title" />
      </div>

      <div>
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={event?.description ?? ""}
          className="min-h-48"
          aria-invalid={!!errors.description}
        />
        {err("description")}
      </div>

      <ImageField name="image" altName="imageAlt" defaultUrl={event?.image} defaultAlt={event?.imageAlt} errors={errors} />

      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}

      <div className="flex flex-wrap items-center gap-3 border-t border-default pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </Button>
        {event && (
          <Link href={`/events/${event.slug}`} target="_blank" className="text-sm text-muted hover:underline">
            View on site ↗
          </Link>
        )}
      </div>
    </form>
  );
}
