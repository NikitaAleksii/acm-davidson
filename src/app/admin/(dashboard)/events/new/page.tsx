import Link from "next/link";
import { SectionTitle } from "@/components/ui";
import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <div className="max-w-4xl">
      <Link href="/admin/events" className="text-sm text-muted hover:underline">
        ← Events
      </Link>
      <div className="mt-2">
        <SectionTitle as="h1" title="New event" />
      </div>
      <EventForm />
    </div>
  );
}
