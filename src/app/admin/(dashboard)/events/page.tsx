import Link from "next/link";
import { db } from "@/lib/db";
import { formatEventRange } from "@/lib/utils";
import { deleteEvent } from "@/actions/admin";
import { Alert, ButtonLink, EmptyState, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events" };

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.event.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: "asc" } }),
    db.event.findMany({ where: { startsAt: { lt: now } }, orderBy: { startsAt: "desc" } }),
  ]);

  const Table = ({ rows, title }: { rows: typeof upcoming; title: string }) => (
    <section className="mb-10">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">None.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Where</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/events/${e.id}`} className="font-semibold hover:underline">
                      {e.title}
                    </Link>
                    {e.rsvpUrl && <p className="text-xs text-muted">Has RSVP link</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatEventRange(e.startsAt, e.endsAt)}</td>
                  <td className="px-4 py-3 text-muted">{e.location}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/events/${e.slug}`} target="_blank" className="text-brand-600 hover:underline">
                        View
                      </Link>
                      <Link href={`/admin/events/${e.id}`} className="hover:underline">
                        Edit
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <ConfirmButton message={`Delete “${e.title}”?`} className="text-red-600 hover:underline">
                          Delete
                        </ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  return (
    <div>
      <SectionTitle as="h1" title="Events" action={<ButtonLink href="/admin/events/new">New event</ButtonLink>} />
      {deleted && (
        <div className="mb-4">
          <Alert kind="success">Event deleted.</Alert>
        </div>
      )}
      {upcoming.length + past.length === 0 ? (
        <EmptyState title="No events yet">Create the first one and it will show on the homepage.</EmptyState>
      ) : (
        <>
          <Table rows={upcoming} title="Upcoming" />
          <Table rows={past} title="Past (archived automatically)" />
        </>
      )}
    </div>
  );
}
