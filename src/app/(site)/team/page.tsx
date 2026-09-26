import type { Metadata } from "next";
import { getArchivedOfficersByYear, getCurrentOfficers } from "@/lib/queries";
import { site } from "@/lib/site";
import { Container, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { OfficerCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team",
  description: "Meet the officers who run the ACM Davidson student chapter.",
  openGraph: { title: "ACM Davidson team", description: "Meet the officers who run the chapter.", url: "/team" },
};

export default async function TeamPage() {
  const [{ year, officers }, archived] = await Promise.all([getCurrentOfficers(), getArchivedOfficersByYear()]);

  return (
    <>
      <PageHeader
        title="Team"
        intro="The students who keep ACM Davidson running. Want to help out? Elections run every Fall."
      />
      <Container className="py-12">
        <section aria-labelledby="current-officers">
          <SectionTitle title={year ? `Officers, ${year}` : "Officers"} />
          <span id="current-officers" className="sr-only">
            Current officers
          </span>
          {officers.length ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {officers.map((o) => (
                <li key={o.id}>
                  <OfficerCard officer={o} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Officer profiles coming soon">
              Reach us at{" "}
              <a href={`mailto:${site.email}`} className="underline">
                {site.email}
              </a>{" "}
              in the meantime.
            </EmptyState>
          )}
        </section>

        {archived.length > 0 && (
          <section className="mt-16" aria-labelledby="past-officers">
            <SectionTitle title="Past officers" />
            <span id="past-officers" className="sr-only">
              Past officers by academic year
            </span>
            <div className="space-y-4">
              {archived.map(([yr, list]) => (
                <details key={yr} className="group rounded-xl border border-default bg-card">
                  <summary className="cursor-pointer select-none px-5 py-4 font-display font-bold marker:text-brand-600">
                    {yr}{" "}
                    <span className="ml-2 text-sm font-normal text-muted">
                      {list.length} {list.length === 1 ? "officer" : "officers"}
                    </span>
                  </summary>
                  <ul className="grid gap-x-6 gap-y-2 border-t border-default px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((o) => (
                      <li key={o.id} className="text-sm">
                        <span className="font-semibold">{o.name}</span>
                        <span className="text-muted"> · {o.role}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
