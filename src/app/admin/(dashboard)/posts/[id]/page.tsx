import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deletePost } from "@/actions/admin";
import { Alert, SectionTitle } from "@/components/ui";
import { PostForm } from "@/components/admin/post-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit post" };

const savedMessages: Record<string, string> = {
  created: "Draft saved.",
  updated: "Changes saved.",
  published: "Post published. It's live on the site now.",
  unpublished: "Post unpublished. It's back to a draft.",
};

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/posts" className="text-sm text-muted hover:underline">
        ← Posts
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <SectionTitle as="h1" title="Edit post" />
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <ConfirmButton
            message={`Delete “${post.title}”? This cannot be undone.`}
            className="text-sm text-red-600 hover:underline"
          >
            Delete post
          </ConfirmButton>
        </form>
      </div>
      {saved && savedMessages[saved] && (
        <div className="mb-6">
          <Alert kind="success">{savedMessages[saved]}</Alert>
        </div>
      )}
      <PostForm post={post} />
    </div>
  );
}
