"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarDays, FileText, LayoutDashboard, Mail, Users, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", Icon: FileText },
  { href: "/admin/events", label: "Events", Icon: CalendarDays },
  { href: "/admin/team", label: "Team", Icon: Users },
  { href: "/admin/messages", label: "Messages", Icon: Mail },
  { href: "/admin/subscribers", label: "Subscribers", Icon: UserPlus },
  { href: "/admin/activity", label: "Activity log", Icon: Activity },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="lg:w-52 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-brand-600 text-white" : "text-muted hover:bg-surface-muted hover:text-fg",
                )}
              >
                <Icon size={16} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
