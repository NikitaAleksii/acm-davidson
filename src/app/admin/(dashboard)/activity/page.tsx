import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activity log" };

const PAGE_SIZE = 50;

export default async function AdminActivity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { email: true } } },
    }),
    db.activityLog.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <SectionTitle as="h1" title="Activity log" />
      <p className="mb-6 text-sm text-muted">Who created, edited, published, or deleted what, and when.</p>
      {rows.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    <time dateTime={a.createdAt.toISOString()}>{formatDateTime(a.createdAt)}</time>
                  </td>
                  <td className="px-4 py-3" title={a.user?.email ?? ""}>
                    {a.actorName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold">
                      {a.action.replace("_", " ")} · {a.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/admin/activity?page=${page - 1}`} className="hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={`/admin/activity?page=${page + 1}`} className="hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
