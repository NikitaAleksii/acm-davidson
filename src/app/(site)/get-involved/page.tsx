import type { Metadata } from "next";
import { CalendarDays, Mail, MapPin, Users } from "lucide-react";
import { Instagram } from "@/components/brand-icons";
import { site } from "@/lib/site";
import { getUpcomingEvents } from "@/lib/queries";
import { formatEventRange } from "@/lib/utils";
import { ButtonLink, Card, Container, PageHeader } from "@/components/ui";
import { ContactForm, SubscribeForm } from "@/components/forms";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Get Involved",
  description:
    "Join ACM Davidson: how to become a member, when and where we meet, and how to sign up for the mailing list.",
  openGraph: { title: "Get involved with ACM Davidson", description: "How to join, meeting times, and signup.", url: "/get-involved" },
};

export default async function GetInvolvedPage() {
  const [nextEvent] = await getUpcomingEvents(1);

  const steps = [
    {
      Icon: Users,
      title: "Join the chapter on WildcatSync",
      body: "It takes a minute and puts you on our official roster. No dues.",
      action: (
        <ButtonLink href={site.joinUrl} external className="mt-3">
          Join on WildcatSync
        </ButtonLink>
      ),
    },
    {
      Icon: CalendarDays,
      title: "Come to an event",
      body: nextEvent
        ? `Next up: ${nextEvent.title} on ${formatEventRange(nextEvent.startsAt, nextEvent.endsAt)}.`
        : "We post every workshop, talk, and social on the events page.",
      action: (
        <ButtonLink href={nextEvent ? `/events/${nextEvent.slug}` : "/events"} variant="secondary" className="mt-3">
          {nextEvent ? "Event details" : "See events"}
        </ButtonLink>
      ),
    },
    {
      Icon: Instagram,
      title: "Follow along",
      body: "Announcements, photos, and reminders on Instagram. Mailing list for the important stuff.",
      action: (
        <ButtonLink href={site.social.instagram} external variant="secondary" className="mt-3">
          @acm.davidson
        </ButtonLink>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Get involved"
        intro="Three easy steps. You don't need to be a CS major or know how to code."
      />

      <Container className="py-12">
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map(({ Icon, title, body, action }, i) => (
            <li key={title}>
              <Card className="flex h-full flex-col p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-display font-bold text-white">
                    {i + 1}
                  </span>
                  <Icon size={22} aria-hidden className="text-brand-600" />
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">{title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted">{body}</p>
                {action}
              </Card>
            </li>
          ))}
        </ol>
      </Container>

      <section className="border-t border-default bg-surface-muted py-12">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Meetings</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex gap-3">
                <CalendarDays size={20} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <dt className="font-semibold">When</dt>
                  <dd className="text-muted">{site.meeting.when}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin size={20} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <dt className="font-semibold">Where</dt>
                  <dd className="text-muted">{site.meeting.where}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail size={20} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                <div>
                  <dt className="font-semibold">Email</dt>
                  <dd>
                    <a href={`mailto:${site.email}`} className="text-brand-600 hover:underline">
                      {site.email}
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
            <p className="mt-6 text-sm text-muted">
              Questions about accessibility or accommodations for an event?{" "}
              <Link href="/contact" className="underline">
                Let us know
              </Link>{" "}
              and we&apos;ll make it work.
            </p>
          </div>
          <Card className="p-6">
            <h2 className="font-display text-xl font-bold">Mailing list</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              A short email whenever we announce something. No spam.
            </p>
            <SubscribeForm />
          </Card>
        </Container>
      </section>

      <section className="py-12">
        <Container className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight">Want to help run things?</h2>
          <p className="mb-6 mt-2 text-muted">
            Have an idea for a workshop, want to sponsor an event, or interested in becoming an officer?
            Send us a note.
          </p>
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
