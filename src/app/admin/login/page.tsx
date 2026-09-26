import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Alert, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; all?: string }>;
}) {
  const { next, all } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/admin") ? next : "/admin");

  return (
    <main id="main" className="flex flex-1 items-center justify-center bg-surface-muted px-4 py-16">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="mx-auto block w-fit">
          <Image src="/images/acm-davidson-diamond.png" alt="ACM Davidson" width={80} height={80} className="h-20 w-20" />
        </Link>
        <h1 className="mt-4 text-center font-display text-xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-center text-sm text-muted">Officers only. Contact the president for access.</p>
        {all && (
          <div className="mt-4">
            <Alert kind="success">You&apos;ve been signed out of all devices.</Alert>
          </div>
        )}
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </Card>
    </main>
  );
}
