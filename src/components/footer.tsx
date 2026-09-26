import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle, PawPrint } from "lucide-react";
import { Instagram, Linkedin } from "./brand-icons";
import { nav, site } from "@/lib/site";

export function Footer() {
  const socials = [
    { href: site.joinUrl, label: "WildcatSync (join the chapter)", Icon: PawPrint },
    { href: site.social.instagram, label: "Instagram", Icon: Instagram },
    { href: site.social.linkedin, label: "LinkedIn", Icon: Linkedin },
    { href: site.social.discord || site.social.groupme, label: site.social.discord ? "Discord" : "GroupMe", Icon: MessageCircle },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 border-t border-default bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/images/acm-davidson-diamond.png"
            alt=""
            width={72}
            height={72}
            className="h-16 w-16"
          />
          <p className="mt-4 text-sm">
            <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:underline">
              <Mail size={16} aria-hidden /> {site.email}
            </a>
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Pages</h2>
          <ul className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className="text-muted hover:underline">
                Admin
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Connect</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.name} on ${label}`}
                  title={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-default bg-card hover:border-brand-600 hover:text-brand-600"
                >
                  <Icon size={18} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-2 text-sm">
            <li>
              <a href={site.davidsonUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Davidson College ↗
              </a>
            </li>
            <li>
              <a href={site.acmUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                ACM national ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-default">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} {site.fullName}
        </p>
      </div>
    </footer>
  );
}
