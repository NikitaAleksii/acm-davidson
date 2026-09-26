import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/queries";
import { POST_TAGS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Container, EmptyState, Input, PageHeader } from "@/components/ui";
import { PostCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Posts",
  description: "News, recaps, and announcements from ACM Davidson.",
  openGraph: { title: "ACM Davidson posts", description: "News, recaps, and announcements.", url: "/posts" },
};

type Props = { searchParams: Promise<{ q?: string; tag?: string }> };

export default async function PostsPage({ searchParams }: Props) {
  const { q = "", tag = "" } = await searchParams;
  const posts = await searchPosts(q, tag);

  return (
    <>
      <PageHeader title="Posts" intro="News, event recaps, and announcements from the chapter.">
        <form action="/posts" method="get" role="search" className="mt-6 flex max-w-lg gap-2">
          <label htmlFor="q" className="sr-only">
            Search posts
          </label>
          <div className="relative flex-1">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input id="q" name="q" type="search" defaultValue={q} placeholder="Search by title, text, or tag" className="pl-9" />
          </div>
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>
        <nav aria-label="Filter by tag" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={q ? `/posts?q=${encodeURIComponent(q)}` : "/posts"}
                aria-current={!tag ? "true" : undefined}
                className={cn(
                  "inline-block rounded-full border px-3 py-1 text-xs font-semibold",
                  !tag ? "border-brand-600 bg-brand-600 text-white" : "border-default bg-card hover:border-brand-600",
                )}
              >
                All
              </Link>
            </li>
            {POST_TAGS.map((t) => (
              <li key={t}>
                <Link
                  href={`/posts?tag=${encodeURIComponent(t)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  aria-current={tag === t ? "true" : undefined}
                  className={cn(
                    "inline-block rounded-full border px-3 py-1 text-xs font-semibold",
                    tag === t ? "border-brand-600 bg-brand-600 text-white" : "border-default bg-card hover:border-brand-600",
                  )}
                >
                  {t}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <Container className="py-12">
        <p className="mb-6 text-sm text-muted" aria-live="polite">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
          {q && (
            <>
              {" "}
              matching <strong>“{q}”</strong>
            </>
          )}
          {tag && (
            <>
              {" "}
              tagged <strong>{tag}</strong>
            </>
          )}
        </p>
        {posts.length ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <li key={p.id}>
                <PostCard post={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No posts found">
            {q || tag ? (
              <Link href="/posts" className="underline">
                Clear search
              </Link>
            ) : (
              "Check back soon."
            )}
          </EmptyState>
        )}
      </Container>
    </>
  );
}
