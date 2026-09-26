import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { currentAcademicYear } from "@/lib/site";
import { archiveAcademicYear, deleteOfficer, moveOfficer, setOfficerArchived } from "@/actions/admin";
import { Alert, ButtonLink, EmptyState, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function AdminTeam({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const { saved, deleted } = await searchParams;
  const officers = await db.officer.findMany({
    orderBy: [{ archived: "asc" }, { academicYear: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const groups = new Map<string, typeof officers>();
  for (const o of officers) {
    const key = `${o.archived ? "archived" : "active"}:${o.academicYear}`;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const active = Array.from(groups.entries()).filter(([k]) => k.startsWith("active:"));
  const archived = Array.from(groups.entries()).filter(([k]) => k.startsWith("archived:"));

  const Row = ({ o, index, total }: { o: (typeof officers)[number]; index: number; total: number }) => (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-600">
        {o.photo && <Image src={o.photo} alt="" fill sizes="40px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/team/${o.id}`} className="font-semibold hover:underline">
          {o.name}
        </Link>
        <p className="text-xs text-muted">{o.role}</p>
      </div>
      {!o.archived && (
        <div className="flex gap-1">
          <form action={moveOfficer}>
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={index === 0}
              aria-label={`Move ${o.name} up`}
              className="rounded-md border border-default p-1.5 hover:bg-surface-muted disabled:opacity-30"
            >
              <ArrowUp size={14} aria-hidden />
            </button>
          </form>
          <form action={moveOfficer}>
            <input type="hidden" name="id" value={o.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={index === total - 1}
              aria-label={`Move ${o.name} down`}
              className="rounded-md border border-default p-1.5 hover:bg-surface-muted disabled:opacity-30"
            >
              <ArrowDown size={14} aria-hidden />
            </button>
          </form>
        </div>
      )}
      <div className="flex items-center gap-3 text-sm">
        <Link href={`/admin/team/${o.id}`} className="hover:underline">
          Edit
        </Link>
        <form action={setOfficerArchived}>
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="archived" value={o.archived ? "false" : "true"} />
          <button type="submit" className="text-muted hover:underline">
            {o.archived ? "Restore" : "Archive"}
          </button>
        </form>
        <form action={deleteOfficer}>
          <input type="hidden" name="id" value={o.id} />
          <ConfirmButton message={`Delete ${o.name}? Prefer “Archive” to keep them in the past officers list.`} className="text-red-600 hover:underline">
            Delete
          </ConfirmButton>
        </form>
      </div>
    </li>
  );

  return (
    <div>
      <SectionTitle as="h1" title="Team" action={<ButtonLink href="/admin/team/new">Add officer</ButtonLink>} />
      {saved && (
        <div className="mb-4">
          <Alert kind="success">Officer saved.</Alert>
        </div>
      )}
      {deleted && (
        <div className="mb-4">
          <Alert kind="success">Officer deleted.</Alert>
        </div>
      )}
      <p className="mb-6 text-sm text-muted">
        The Team page shows the current academic year ({currentAcademicYear()}) or, if empty, the most
        recent year with officers. Use the arrows to reorder. Archive a year when a new board takes over.
      </p>

      {officers.length === 0 && <EmptyState title="No officers yet">Add the current board to populate the Team page.</EmptyState>}

      {active.map(([key, list]) => {
        const year = key.split(":")[1];
        return (
          <section key={key} className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{year}</h2>
              <form action={archiveAcademicYear}>
                <input type="hidden" name="academicYear" value={year} />
                <ConfirmButton
                  message={`Archive all ${list.length} officers from ${year}? They'll move to “Past officers” on the Team page.`}
                  className="text-sm text-muted hover:underline"
                >
                  Archive whole year
                </ConfirmButton>
              </form>
            </div>
            <ol className="divide-y divide-[var(--border)] rounded-xl border border-default bg-card">
              {list.map((o, i) => (
                <Row key={o.id} o={o} index={i} total={list.length} />
              ))}
            </ol>
          </section>
        );
      })}

      {archived.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-2 font-display text-lg font-bold text-muted">Archived</h2>
          {archived.map(([key, list]) => (
            <details key={key} className="mb-3 rounded-xl border border-default bg-card">
              <summary className="cursor-pointer px-4 py-3 font-semibold">
                {key.split(":")[1]} <span className="text-sm font-normal text-muted">({list.length})</span>
              </summary>
              <ol className="divide-y divide-[var(--border)] border-t border-default">
                {list.map((o, i) => (
                  <Row key={o.id} o={o} index={i} total={list.length} />
                ))}
              </ol>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}
