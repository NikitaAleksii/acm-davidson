import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { truncate } from "@/lib/utils";
import { PostArticle } from "@/components/post-article";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string) {
  return db.post.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  const description = post.excerpt || truncate(post.content);
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url: `/posts/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.coverAlt ?? post.title }] } : {}),
    },
    twitter: { card: post.coverImage ? "summary_large_image" : "summary" },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <PostArticle post={post} />;
}
