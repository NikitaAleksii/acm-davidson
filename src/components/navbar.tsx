"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-default bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-md" aria-label={`${site.name} home`}>
          <Image
            src="/images/acm-davidson-wordmark.png"
            alt=""
            width={756}
            height={400}
            priority
            className="h-10 w-auto"
          />
          <span className="sr-only">{site.name}</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition hover:bg-surface-muted hover:text-fg",
                  isActive(item.href) ? "text-brand-600 dark:text-brand-400" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <a
              href={site.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Join us
            </a>
          </li>
          <li className="ml-1">
            <ThemeToggle />
          </li>
        </ul>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-default text-fg"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        hidden={!open}
        className="border-t border-default bg-surface lg:hidden"
      >
        <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2.5 text-base font-medium hover:bg-surface-muted",
                  isActive(item.href) ? "text-brand-600 dark:text-brand-400" : "text-fg",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <a
              href={site.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md bg-brand-600 px-4 py-2.5 text-center text-base font-semibold text-white"
            >
              Join us
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
