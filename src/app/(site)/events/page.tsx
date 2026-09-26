import type { Metadata } from "next";
import { getPastEvents, getUpcomingEvents } from "@/lib/queries";
import { site } from "@/lib/site";
import { Container, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { EventCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past ACM Davidson events: workshops, hackathons, talks, and socials.",
  openGraph: { title: "ACM Davidson events", description: "Workshops, hackathons, talks, and socials.", url: "/events" },
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents(24)]);

  return (
    <>
      <PageHeader title="Events" intro="Workshops, hackathons, talks, and socials. Everyone is welcome." />
      <Container className="py-12">
        <section aria-labelledby="upcoming">
          <SectionTitle title="Upcoming" />
          <span id="upcoming" className="sr-only">
            Upcoming events
          </span>
          {upcoming.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing on the calendar right now">
              New events are posted here and on{" "}
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="underline">
                Instagram
              </a>
              .
            </EmptyState>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-16" aria-labelledby="past">
            <SectionTitle title="Past events" />
            <span id="past" className="sr-only">
              Past events
            </span>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} past />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
