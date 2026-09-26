import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";
import { themeInitScript } from "@/components/theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Davidson College ACM Student Chapter`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.fullName,
    title: site.fullName,
    description: site.description,
    url: "/",
    images: [{ url: "/images/acm-davidson-diamond.png", width: 1100, height: 1100, alt: "ACM Davidson logo" }],
  },
  twitter: {
    card: "summary",
    title: site.fullName,
    description: site.description,
    images: ["/images/acm-davidson-diamond.png"],
  },
  icons: {
    icon: "/images/acm-davidson-diamond.png",
    apple: "/images/acm-davidson-diamond.png",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "Xz9FAHKGhFP7NOkVgmX2EcFOz1llduejk_H7ozLnoEI",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c8102e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) add attributes to <body>. */}
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
