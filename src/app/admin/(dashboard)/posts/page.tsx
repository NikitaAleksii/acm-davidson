import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime, parseTags } from "@/lib/utils";
import { deletePost } from "@/actions/admin";
import { Alert, ButtonLink, EmptyState, SectionTitle, Tag } from "@/components/ui";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Posts" };

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams;
  const posts = await db.post.findMany({ orderBy: [{ published: "asc" }, { updatedAt: "desc" }] });

  return (
    <div>
      <SectionTitle as="h1" title="Posts" action={<ButtonLink href="/admin/posts/new">New post</ButtonLink>} />
      {deleted && (
        <div className="mb-4">
          <Alert kind="success">Post deleted.</Alert>
        </div>
      )}
      {posts.length === 0 ? (
        <EmptyState title="No posts yet">Write your first post to populate the homepage.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-default bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {posts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-semibold hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted">/posts/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {parseTags(p.tags).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDateTime(p.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/preview/posts/${p.id}`} target="_blank" className="text-brand-600 hover:underline">
                        Preview
                      </Link>
                      <Link href={`/admin/posts/${p.id}`} className="hover:underline">
                        Edit
                      </Link>
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmButton message={`Delete “${p.title}”? This cannot be undone.`} className="text-red-600 hover:underline">
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
    </div>
  );
}
