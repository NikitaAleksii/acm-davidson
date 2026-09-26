import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";
import { ButtonLink, Card, Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about the ACM Davidson student chapter: our mission, what ACM is, and how we build a computing community at Davidson College.",
  openGraph: { title: "About ACM Davidson", description: site.description, url: "/about" },
};

const pillars = [
  {
    title: "Learn",
    body: "Hands-on workshops on things classes don't always cover: Git, web dev, cloud, machine learning, interview prep, and whatever members ask for.",
  },
  {
    title: "Build",
    body: "Hackathons, project nights, and open-source collaborations. Ship something with friends, then show it off.",
  },
  {
    title: "Connect",
    body: "Talks from alumni and industry folks, socials, and a community that helps each other find internships and research.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About ACM Davidson"
        intro="We're the Davidson College student chapter of the Association for Computing Machinery, the world's largest computing society."
      />
      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_320px]">
        <div className="prose-acm max-w-none">
          <h2>Our mission</h2>
          <p>
            ACM Davidson exists to make computing approachable, social, and fun at Davidson. We bring
            together students from every major who are curious about how software works and what it
            can do. Whether you wrote your first line of code last week or you&apos;re deep into a
            research project, there&apos;s a seat for you.
          </p>
          <p>
            We host workshops, run hackathons, invite speakers, and organize socials throughout the
            year. We also connect members with each other and with alumni working in tech.
          </p>

          <h2>What is ACM?</h2>
          <p>
            The Association for Computing Machinery (ACM) was founded in 1947 and is the world&apos;s
            largest educational and scientific computing society. It publishes research, runs
            conferences, awards the Turing Award, and supports hundreds of student chapters around
            the world. Student membership in the national ACM is optional but gives you access to the
            ACM Digital Library, learning resources, and a global network.
          </p>
          <p>
            <a href={site.acmUrl} target="_blank" rel="noopener noreferrer">
              Learn more about ACM at acm.org ↗
            </a>
          </p>

          <h2>Who can join?</h2>
          <p>
            Any Davidson student. No prerequisites, no dues for chapter membership, no CS major
            required. Join the chapter on WildcatSync and come to the next event.
          </p>
        </div>

        <aside className="space-y-6">
          <Card className="p-6 text-center">
            <Image
              src="/images/acm-davidson-diamond.png"
              alt="ACM Davidson Student Chapter logo"
              width={200}
              height={200}
              className="mx-auto h-40 w-40"
            />
            <ButtonLink href={site.joinUrl} external className="mt-4 w-full">
              Join on WildcatSync
            </ButtonLink>
          </Card>
          <Card className="p-6">
            <h2 className="font-display font-bold">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={site.acmUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  ACM national ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.acm.org/membership/student"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  ACM student membership ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.davidson.edu/academic-departments/mathematics-and-computer-science"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  Davidson Math &amp; CS department ↗
                </a>
              </li>
            </ul>
          </Card>
        </aside>
      </Container>

      <section className="border-t border-default bg-surface-muted py-12">
        <Container>
          <h2 className="font-display text-2xl font-bold tracking-tight">What we do</h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {pillars.map((p) => (
              <li key={p.title}>
                <Card className="h-full p-6">
                  <h3 className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted">{p.body}</p>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
