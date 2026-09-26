import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CalendarPlus, ExternalLink, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { formatEventRange, truncate, isUpload } from "@/lib/utils";
import { ButtonLink, Container } from "@/components/ui";
import { Markdown } from "@/components/markdown";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function getEvent(slug: string) {
  return db.event.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };
  const description = truncate(event.description);
  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      url: `/events/${event.slug}`,
      type: "article",
      ...(event.image ? { images: [{ url: event.image, alt: event.imageAlt ?? event.title }] } : {}),
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  const isPast = event.startsAt < new Date();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startsAt.toISOString(),
    ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
    location: { "@type": "Place", name: event.location },
    description: truncate(event.description, 300),
    ...(event.image ? { image: event.image } : {}),
    organizer: { "@type": "Organization", name: "ACM Davidson" },
  };

  return (
    <article>
      <div className="border-b border-default bg-surface-muted">
        <Container className="py-10 sm:py-14">
          <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
            ← All events
          </Link>
          {isPast && (
            <p className="mt-4 inline-block rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Past event
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{event.title}</h1>
          <dl className="mt-5 flex flex-col gap-2 text-base sm:flex-row sm:flex-wrap sm:gap-x-8">
            <div className="flex items-center gap-2">
              <dt className="sr-only">When</dt>
              <CalendarDays size={18} aria-hidden className="text-brand-600" />
              <dd>
                <time dateTime={event.startsAt.toISOString()}>{formatEventRange(event.startsAt, event.endsAt)}</time>
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Where</dt>
              <MapPin size={18} aria-hidden className="text-brand-600" />
              <dd>{event.location}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {event.rsvpUrl && !isPast && (
              <ButtonLink href={event.rsvpUrl} external>
                RSVP / Register <ExternalLink size={16} aria-hidden />
              </ButtonLink>
            )}
            <ButtonLink href={`/events/${event.slug}/calendar.ics`} variant="secondary">
              <CalendarPlus size={16} aria-hidden /> Add to calendar
            </ButtonLink>
          </div>
        </Container>
      </div>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_360px]">
        <Markdown content={event.description} className="max-w-none" />
        {event.image && (
          <figure className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-default bg-surface-muted lg:order-first lg:col-start-2 lg:row-start-1">
            <Image
              src={event.image}
              unoptimized={isUpload(event.image)}
              alt={event.imageAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 360px, 100vw"
              className="object-cover"
            />
          </figure>
        )}
      </Container>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
