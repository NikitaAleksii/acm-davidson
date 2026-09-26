import type { Metadata } from "next";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ButtonLink, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        <Container className="flex flex-col items-center py-24 text-center">
          <Image
            src="/images/acm-davidson-diamond.png"
            alt=""
            width={120}
            height={120}
            className="h-28 w-28 opacity-90"
          />
          <p className="mt-6 font-display text-6xl font-extrabold text-brand-600">404</p>
          <h1 className="mt-2 font-display text-2xl font-bold">That page doesn&apos;t exist</h1>
          <p className="mt-3 max-w-md text-muted">
            The link may be broken, or the page may have been moved. Segfault of the web edition.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Go home</ButtonLink>
            <ButtonLink href="/events" variant="secondary">
              See events
            </ButtonLink>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
