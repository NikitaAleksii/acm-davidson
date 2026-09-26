import Link from "next/link";
import { CalendarDays, FileText, Mail, UserPlus, Users } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTime, formatEventRange } from "@/lib/utils";
import { ButtonLink, Card, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const [posts, drafts, upcoming, officers, unread, subscribers, recent, nextEvents, recentDrafts] =
    await Promise.all([
      db.post.count({ where: { published: true } }),
      db.post.count({ where: { published: false } }),
      db.event.count({ where: { startsAt: { gte: now } } }),
      db.officer.count({ where: { archived: false } }),
      db.message.count({ where: { read: false } }),
      db.subscriber.count(),
      db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      db.event.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 3 }),
      db.post.findMany({ where: { published: false }, orderBy: { updatedAt: "desc" }, take: 3 }),
    ]);

  const stats = [
    { label: "Published posts", value: posts, sub: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/posts", Icon: FileText },
    { label: "Upcoming events", value: upcoming, href: "/admin/events", Icon: CalendarDays },
    { label: "Current officers", value: officers, href: "/admin/team", Icon: Users },
    { label: "Unread messages", value: unread, href: "/admin/messages", Icon: Mail },
    { label: "Subscribers", value: subscribers, href: "/admin/subscribers", Icon: UserPlus },
  ];

  return (
    <div className="space-y-10">
      <div>
        <SectionTitle as="h1" title="Dashboard" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map(({ label, value, sub, href, Icon }) => (
            <li key={label}>
              <Link href={href} className="block rounded-xl focus-visible:outline-none">
                <Card className="p-4 transition hover:border-brand-600">
                  <Icon size={18} aria-hidden className="text-brand-600" />
                  <p className="mt-2 font-display text-3xl font-bold">{value}</p>
                  <p className="text-sm text-muted">{label}</p>
                  {sub && <p className="text-xs text-muted">{sub}</p>}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/admin/posts/new">New post</ButtonLink>
        <ButtonLink href="/admin/events/new" variant="secondary">
          New event
        </ButtonLink>
        <ButtonLink href="/admin/team/new" variant="secondary">
          Add officer
        </ButtonLink>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle title="Next events" />
          {nextEvents.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-xl border border-default bg-card">
              {nextEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <Link href={`/admin/events/${e.id}`} className="font-semibold hover:underline">
                      {e.title}
                    </Link>
                    <p className="text-sm text-muted">{formatEventRange(e.startsAt, e.endsAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No upcoming events. Add one so the homepage isn&apos;t empty.</p>
          )}
        </section>

        <section>
          <SectionTitle title="Recent drafts" />
          {recentDrafts.length ? (
            <ul className="divide-y divide-[var(--border)] rounded-xl border border-default bg-card">
              {recentDrafts.map((p) => (
                <li key={p.id} className="p-4">
                  <Link href={`/admin/posts/${p.id}`} className="font-semibold hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-sm text-muted">Edited {formatDateTime(p.updatedAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No drafts in progress.</p>
          )}
        </section>
      </div>

      <section>
        <SectionTitle
          title="Recent activity"
          action={
            <Link href="/admin/activity" className="text-sm font-semibold text-brand-600 hover:underline">
              Full log →
            </Link>
          }
        />
        {recent.length ? (
          <ol className="divide-y divide-[var(--border)] rounded-xl border border-default bg-card text-sm">
            {recent.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 p-3">
                <span className="font-semibold">{a.actorName}</span>
                <span>{a.summary}</span>
                <time dateTime={a.createdAt.toISOString()} className="ml-auto text-xs text-muted">
                  {formatDateTime(a.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">Nothing yet.</p>
        )}
      </section>
    </div>
  );
}
