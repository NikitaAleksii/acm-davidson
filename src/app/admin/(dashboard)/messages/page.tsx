import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { deleteMessage, setMessageRead } from "@/actions/admin";
import { EmptyState, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Messages" };

export default async function AdminMessages() {
  const messages = await db.message.findMany({ orderBy: { createdAt: "desc" } });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <div>
      <SectionTitle as="h1" title={`Messages${unread ? ` (${unread} unread)` : ""}`} />
      <p className="mb-6 text-sm text-muted">
        Contact-form submissions. Each one is also emailed to the chapter address when SMTP is configured.
      </p>
      {messages.length === 0 ? (
        <EmptyState title="No messages yet" />
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border bg-card p-5",
                m.read ? "border-default" : "border-brand-600/60 shadow-sm",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                  {m.name}{" "}
                  <a href={`mailto:${m.email}`} className="font-normal text-brand-600 hover:underline">
                    {m.email}
                  </a>
                  {m.classYear && <span className="ml-2 text-xs text-muted">· {m.classYear}</span>}
                </p>
                <time dateTime={m.createdAt.toISOString()} className="text-xs text-muted">
                  {formatDateTime(m.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to ACM Davidson")}`}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Reply by email
                </a>
                <form action={setMessageRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.read ? "false" : "true"} />
                  <button type="submit" className="text-muted hover:underline">
                    Mark as {m.read ? "unread" : "read"}
                  </button>
                </form>
                <form action={deleteMessage}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message="Delete this message?" className="text-red-600 hover:underline">
                    Delete
                  </ConfirmButton>
                </form>
                {!m.emailed && (
                  <span className="ml-auto text-xs text-muted" title="SMTP not configured or send failed">
                    Not emailed
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
