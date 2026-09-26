import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout, logoutAll } from "@/actions/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · ACM Davidson" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-default bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-display font-bold">
              <Image src="/images/acm-davidson-diamond.png" alt="" width={32} height={32} className="h-8 w-8" />
              <span>Admin</span>
            </Link>
            <Link href="/" className="hidden text-sm text-muted hover:underline sm:inline">
              View site ↗
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted md:inline" title={user.email}>
              {user.name}
            </span>
            <ThemeToggle />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-default px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
              >
                Log out
              </button>
            </form>
            <form action={logoutAll}>
              <ConfirmButton
                message="Sign out of every device, including this one?"
                className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-fg hover:underline"
              >
                all sessions
              </ConfirmButton>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <AdminNav />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
