import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PostArticle } from "@/components/post-article";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/preview/posts/${id}`);
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <>
      <div className="sticky top-0 z-50 bg-amber-400 text-sm font-semibold text-black">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <span>
            Preview · {post.published ? "Published" : "Draft"} · this is how the post will look on the site
          </span>
          <Link href={`/admin/posts/${post.id}`} className="underline">
            Back to editor
          </Link>
        </div>
      </div>
      <Navbar />
      <main id="main" className="flex-1">
        <PostArticle post={post} preview />
      </main>
      <Footer />
    </>
  );
}
