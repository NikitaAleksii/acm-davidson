import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteEvent } from "@/actions/admin";
import { Alert, SectionTitle } from "@/components/ui";
import { EventForm } from "@/components/admin/event-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const event = await db.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/events" className="text-sm text-muted hover:underline">
        ← Events
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <SectionTitle as="h1" title="Edit event" />
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <ConfirmButton message={`Delete “${event.title}”?`} className="text-sm text-red-600 hover:underline">
            Delete event
          </ConfirmButton>
        </form>
      </div>
      {saved && (
        <div className="mb-6">
          <Alert kind="success">Event saved.</Alert>
        </div>
      )}
      <EventForm event={event} />
    </div>
  );
}
