import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { deleteMessage, setMessageRead } from "@/actions/admin";
import { EmptyState, SectionTitle } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CopyButton } from "@/components/admin/copy-button";
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
        Contact-form submissions. Copy the sender&apos;s address to reply from Outlook. Each message is
        also emailed to the chapter address when SMTP is configured.
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
                <div>
                  <p className="font-semibold">
                    {!m.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                    {m.name}
                    {m.classYear && <span className="ml-2 text-xs font-normal text-muted">· {m.classYear}</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm">
                    <span className="select-all font-mono">{m.email}</span>
                    <CopyButton text={m.email} label="Copy email" />
                  </p>
                </div>
                <time dateTime={m.createdAt.toISOString()} className="text-xs text-muted">
                  {formatDateTime(m.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
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
