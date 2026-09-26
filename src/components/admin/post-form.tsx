"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@prisma/client";
import { savePost } from "@/actions/admin";
import type { FormState } from "@/actions/public";
import { POST_TAGS } from "@/lib/site";
import { parseTags, slugify } from "@/lib/utils";
import { Alert, Button, Help, Input, Label, Textarea } from "@/components/ui";
import { ImageField } from "./image-field";
import { Markdown } from "@/components/markdown";
import { useFormAction } from "@/components/use-form-action";

export function PostForm({ post }: { post?: Post }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(savePost, null);
  const errors = state?.errors ?? {};
  const existingTags = parseTags(post?.tags);
  const customDefault = existingTags.filter((t) => !(POST_TAGS as readonly string[]).includes(t)).join(", ");
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!errors.title}
        />
        {err("title")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="slug">URL slug</Label>
          <Input id="slug" name="slug" defaultValue={post?.slug ?? ""} placeholder={slugify(title) || "auto-generated"} />
          <Help>Leave blank to generate from the title. Changing it breaks old links.</Help>
        </div>
        <div>
          <Label htmlFor="authorName">Author</Label>
          <Input id="authorName" name="authorName" defaultValue={post?.authorName ?? ""} placeholder="Defaults to you" />
        </div>
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} className="min-h-16" maxLength={300} />
        <Help>One or two sentences shown on cards and in link previews. Optional.</Help>
      </div>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-3">
          {POST_TAGS.map((t) => (
            <label key={t} className="inline-flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="tags" value={t} defaultChecked={existingTags.includes(t)} className="h-4 w-4 accent-brand-600" />
              {t}
            </label>
          ))}
        </div>
        <Input name="customTags" defaultValue={customDefault} placeholder="Other tags, comma-separated" className="mt-2 max-w-md" />
      </fieldset>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="content" className="mb-0">
            Content (Markdown)
          </Label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-semibold text-brand-600 hover:underline"
            aria-pressed={showPreview}
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>
        <div className={showPreview ? "grid gap-4 lg:grid-cols-2" : ""}>
          <Textarea
            id="content"
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[24rem] font-mono text-sm"
            aria-invalid={!!errors.content}
          />
          {showPreview && (
            <div className="min-h-[24rem] overflow-auto rounded-md border border-default p-4" aria-live="polite">
              <Markdown content={content || "*Nothing to preview yet.*"} />
            </div>
          )}
        </div>
        {err("content")}
        <Help>
          Supports headings (#), **bold**, lists, links [text](url), images ![alt](url), and code blocks.
        </Help>
      </div>

      <ImageField
        name="coverImage"
        altName="coverAlt"
        label="Cover image"
        defaultUrl={post?.coverImage}
        defaultAlt={post?.coverAlt}
        errors={errors}
      />

      {state && !state.ok && <Alert kind="error">{state.message}</Alert>}

      <div className="flex flex-wrap items-center gap-3 border-t border-default pt-6">
        <Button type="submit" name="intent" value="draft" variant="secondary" disabled={pending}>
          {post?.published ? "Save changes" : "Save draft"}
        </Button>
        {post?.published ? (
          <Button type="submit" name="intent" value="unpublish" variant="ghost" disabled={pending}>
            Unpublish
          </Button>
        ) : (
          <Button type="submit" name="intent" value="publish" disabled={pending}>
            Publish
          </Button>
        )}
        {post && (
          <Link
            href={`/admin/preview/posts/${post.id}`}
            target="_blank"
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            Full-page preview ↗
          </Link>
        )}
        {post?.published && (
          <Link href={`/posts/${post.slug}`} target="_blank" className="text-sm text-muted hover:underline">
            View live ↗
          </Link>
        )}
        <span className="ml-auto text-xs text-muted">
          {post ? (post.published ? "Published" : "Draft") : "New post"}
        </span>
      </div>
    </form>
  );
}
