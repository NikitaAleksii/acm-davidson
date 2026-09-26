import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { Github, Linkedin } from "./brand-icons";
import type { Event, Officer, Post } from "@prisma/client";
import { Card, Tag } from "./ui";
import { formatDate, formatEventRange, parseTags, truncate, isUpload } from "@/lib/utils";

export function PostCard({ post, priority = false }: { post: Post; priority?: boolean }) {
  const tags = parseTags(post.tags);
  return (
    <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-md">
      {post.coverImage && (
        <Link href={`/posts/${post.slug}`} tabIndex={-1} aria-hidden className="block">
          <div className="relative aspect-[16/9] w-full bg-surface-muted">
            <Image
              src={post.coverImage}
              unoptimized={isUpload(post.coverImage)}
              alt={post.coverAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
              priority={priority}
            />
          </div>
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        {tags.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5" aria-label="Tags">
            {tags.map((t) => (
              <li key={t}>
                <Tag>{t}</Tag>
              </li>
            ))}
          </ul>
        )}
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link href={`/posts/${post.slug}`} className="hover:text-brand-600 hover:underline">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted">{post.excerpt || truncate(post.content, 140)}</p>
        <p className="mt-4 text-xs text-muted">
          {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>}
          {post.authorName && <> · {post.authorName}</>}
        </p>
      </div>
    </Card>
  );
}

export function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  return (
    <Card className={`flex h-full flex-col overflow-hidden transition hover:shadow-md ${past ? "opacity-90" : ""}`}>
      {event.image && (
        <Link href={`/events/${event.slug}`} tabIndex={-1} aria-hidden className="block">
          <div className="relative aspect-[16/9] w-full bg-surface-muted">
            <Image
              src={event.image}
              unoptimized={isUpload(event.image)}
              alt={event.imageAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
          <CalendarDays size={16} aria-hidden />
          <time dateTime={event.startsAt.toISOString()}>{formatEventRange(event.startsAt, event.endsAt)}</time>
        </p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug">
          <Link href={`/events/${event.slug}`} className="hover:text-brand-600 hover:underline">
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted">
          <MapPin size={14} aria-hidden /> {event.location}
        </p>
        <p className="mt-3 flex-1 text-sm text-muted">{truncate(event.description, 140)}</p>
      </div>
    </Card>
  );
}

export function OfficerCard({ officer }: { officer: Officer }) {
  const initials = officer.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Large portrait-style photo that fills the top of the card. */}
      <div className="relative aspect-[4/5] w-full bg-brand-600">
        {officer.photo ? (
          <Image
            src={officer.photo}
            unoptimized={isUpload(officer.photo)}
            alt={officer.photoAlt || `Photo of ${officer.name}`}
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center font-display text-6xl font-bold text-white"
          >
            {initials}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
      <h3 className="font-display text-xl font-bold">{officer.name}</h3>
      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{officer.role}</p>
      {officer.bio && <p className="mt-2 text-sm text-muted">{officer.bio}</p>}
      {(officer.linkedin || officer.github) && (
        <ul className="mt-auto flex gap-2 pt-4">
          {officer.linkedin && (
            <li>
              <a
                href={officer.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${officer.name} on LinkedIn`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-default hover:border-brand-600 hover:text-brand-600"
              >
                <Linkedin size={16} aria-hidden />
              </a>
            </li>
          )}
          {officer.github && (
            <li>
              <a
                href={officer.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${officer.name} on GitHub`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-default hover:border-brand-600 hover:text-brand-600"
              >
                <Github size={16} aria-hidden />
              </a>
            </li>
          )}
        </ul>
      )}
      </div>
    </Card>
  );
}
