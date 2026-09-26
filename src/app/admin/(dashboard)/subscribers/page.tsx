import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { deleteSubscriber } from "@/actions/admin";
import { EmptyState, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Subscribers" };

export default async function AdminSubscribers() {
  const subscribers = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <SectionTitle
        as="h1"
        title={`Subscribers (${subscribers.length})`}
        action={
          <a
            href="/api/admin/subscribers.csv"
            className="inline-flex items-center gap-2 rounded-md border border-default bg-card px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
          >
            <Download size={16} aria-hidden /> Export CSV
          </a>
        }
      />
      <p className="mb-6 text-sm text-muted">
        Mailing-list signups from the site. Export to CSV to paste into your email tool, and honor
        unsubscribe requests by removing them here.
      </p>
      {subscribers.length === 0 ? (
        <EmptyState title="No subscribers yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class year</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {subscribers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3">{s.name ?? <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3">{s.classYear ?? <span className="text-muted">—</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteSubscriber}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message={`Remove ${s.email} from the list?`} className="text-red-600 hover:underline">
                        Remove
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
