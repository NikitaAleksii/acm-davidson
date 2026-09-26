import Image from "next/image";
import Link from "next/link";
import type { Post } from "@prisma/client";
import { formatLongDate, parseTags, isUpload } from "@/lib/utils";
import { Container, Tag } from "./ui";
import { Markdown } from "./markdown";

/** Shared between the public post page and the admin preview. */
export function PostArticle({ post, preview = false }: { post: Post; preview?: boolean }) {
  const tags = parseTags(post.tags);
  const date = post.publishedAt ?? post.updatedAt;
  return (
    <article>
      <div className="border-b border-default bg-surface-muted">
        <Container className="max-w-3xl py-10 sm:py-14">
          {!preview && (
            <Link href="/posts" className="text-sm font-semibold text-brand-600 hover:underline">
              ← All posts
            </Link>
          )}
          {tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
              {tags.map((t) => (
                <li key={t}>
                  <Link href={`/posts?tag=${encodeURIComponent(t)}`}>
                    <Tag>{t}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="mt-3 text-lg text-muted">{post.excerpt}</p>}
          <p className="mt-4 text-sm text-muted">
            <time dateTime={date.toISOString()}>{formatLongDate(date)}</time>
            {post.authorName && <> · {post.authorName}</>}
            {!post.published && <> · Draft</>}
          </p>
        </Container>
      </div>
      <Container className="max-w-3xl py-10">
        {post.coverImage && (
          <figure className="mb-8">
            <Image
              src={post.coverImage}
              unoptimized={isUpload(post.coverImage)}
              alt={post.coverAlt ?? ""}
              width={1200}
              height={675}
              priority
              sizes="(min-width: 768px) 768px, 100vw"
              className="h-auto w-full rounded-xl border border-default"
            />
          </figure>
        )}
        <Markdown content={post.content} />
      </Container>
    </article>
  );
}
