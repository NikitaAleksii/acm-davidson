import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { site } from "@/lib/site";
import { getLatestPosts, getUpcomingEvents } from "@/lib/queries";
import { formatEventRange, truncate } from "@/lib/utils";
import { ButtonLink, Card, Container, EmptyState, SectionTitle } from "@/components/ui";
import { PostCard } from "@/components/cards";
import { SubscribeForm } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [nextEvents, posts] = await Promise.all([getUpcomingEvents(1), getLatestPosts(3)]);
  const nextEvent = nextEvents[0];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rotate-45 rounded-3xl bg-brand-600/30 blur-2xl"
        />
        <Container className="relative grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">
              Davidson College Student Chapter
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-brand-500">acm</span> davidson
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-300 sm:text-xl">{site.tagline}</p>
            <p className="mt-3 max-w-xl text-gray-400">
              Workshops, hackathons, tech talks, and a friendly community for anyone curious about
              computing. All majors and experience levels welcome.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={site.joinUrl} external className="px-6 py-3 text-base">
                Join us <ArrowRight size={18} aria-hidden />
              </ButtonLink>
              <ButtonLink
                href="/events"
                variant="secondary"
                className="border-white/20 bg-white/10 px-6 py-3 text-base text-white hover:bg-white/20"
              >
                See events
              </ButtonLink>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs lg:max-w-sm">
            <Image
              src="/images/acm-davidson-diamond.png"
              alt="ACM Davidson Student Chapter logo"
              width={440}
              height={440}
              priority
              className="h-auto w-full drop-shadow-2xl"
            />
          </div>
        </Container>
      </section>

      {/* Next event */}
      <section className="py-14 sm:py-16" aria-labelledby="next-event">
        <Container>
          <SectionTitle
            title="Next up"
            action={
              <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">
                All events →
              </Link>
            }
          />
          <span id="next-event" className="sr-only">
            Next event
          </span>
          {nextEvent ? (
            <Card className="grid gap-6 overflow-hidden p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="inline-flex items-center gap-2 font-semibold text-brand-600 dark:text-brand-400">
                  <CalendarDays size={18} aria-hidden />
                  <time dateTime={nextEvent.startsAt.toISOString()}>
                    {formatEventRange(nextEvent.startsAt, nextEvent.endsAt)}
                  </time>
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold">
                  <Link href={`/events/${nextEvent.slug}`} className="hover:underline">
                    {nextEvent.title}
                  </Link>
                </h3>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted">
                  <MapPin size={14} aria-hidden /> {nextEvent.location}
                </p>
                <p className="mt-3 max-w-2xl text-muted">{truncate(nextEvent.description, 220)}</p>
              </div>
              <div className="flex flex-wrap gap-3 md:flex-col">
                <ButtonLink href={`/events/${nextEvent.slug}`}>Details</ButtonLink>
                {nextEvent.rsvpUrl && (
                  <ButtonLink href={nextEvent.rsvpUrl} external variant="secondary">
                    RSVP
                  </ButtonLink>
                )}
                <ButtonLink href={`/events/${nextEvent.slug}/calendar.ics`} variant="secondary">
                  Add to calendar
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <EmptyState title="No upcoming events scheduled yet">
              Follow us on{" "}
              <a href={site.social.instagram} className="underline" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>{" "}
              or join the mailing list below to hear about the next one.
            </EmptyState>
          )}
        </Container>
      </section>

      {/* Latest posts */}
      <section className="border-t border-default bg-surface-muted py-14 sm:py-16">
        <Container>
          <SectionTitle
            title="Latest posts"
            action={
              <Link href="/posts" className="text-sm font-semibold text-brand-600 hover:underline">
                All posts →
              </Link>
            }
          />
          {posts.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No posts yet">Check back soon.</EmptyState>
          )}
        </Container>
      </section>

      {/* Mailing list */}
      <section className="py-14 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Stay in the loop</h2>
            <p className="mt-2 text-muted">
              Get a short email when we announce workshops, hackathons, and speakers. Unsubscribe any
              time by replying.
            </p>
          </div>
          <SubscribeForm compact />
        </Container>
      </section>
    </>
  );
}
