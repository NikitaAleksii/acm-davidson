import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Instagram } from "@/components/brand-icons";
import { site } from "@/lib/site";
import { Card, Container, PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/forms";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the ACM Davidson student chapter.",
  openGraph: { title: "Contact ACM Davidson", description: "Get in touch with the chapter.", url: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact" intro="Questions, ideas, sponsorships, or just saying hi. We read everything." />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <Card className="p-6 sm:p-8">
          <ContactForm />
        </Card>
        <aside className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display font-bold">Other ways to reach us</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Mail size={18} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                <a href={`mailto:${site.email}`} className="hover:underline">
                  {site.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Instagram size={18} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  @acm.davidson
                </a>
              </li>
            </ul>
          </Card>
          <Card className="p-6 text-sm text-muted">
            <p>
              Faculty, alumni, and companies: we love hosting speakers and workshops. Tell us what
              you&apos;d like to talk about and when you&apos;re free.
            </p>
          </Card>
        </aside>
      </Container>
    </>
  );
}
